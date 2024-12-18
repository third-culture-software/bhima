/**
 * @description PAYROLL SETTINGS
 *
 * @requires db
 * @requires EmployeeData
 * @requires Exchange
 * @requires util
 */
const moment = require('moment');
const debug = require('debug')('payroll:payrollSettings');

const db = require('../../../lib/db');
const EmployeeData = require('../employees');
const Exchange = require('../../finance/exchange');
const util = require('../../../lib/util');
const getConfig = require('./getConfig');
const manageConfig = require('./manageConfig');
const calculation = require('./calculation');

const DECIMAL_PRECISION = 2;

const setPaymentDataSQL = 'INSERT INTO payment SET ?';
const setRubricPaymentDataSQL = `INSERT INTO rubric_payment (payment_uuid, rubric_payroll_id, value) VALUES ?`;

// eslint-disable-next-line
const setHolidayPaymentSQL = `INSERT INTO holiday_payment (holiday_id, holiday_nbdays, holiday_percentage, payment_uuid, label, value) VALUES ?`;
// eslint-disable-next-line
const setOffDayPaymentSQL = `INSERT INTO offday_payment (offday_id, offday_percentage, payment_uuid, label, value) VALUES ?`;

function setConfig(
  employees, periodData, rubrics, exchange, enterpriseId,
  currencyId, enterpriseCurrencyId, payrollConfigurationId,
) {
  const enterpriseExchangeRate = currencyId === enterpriseCurrencyId ? 1 : exchange.rate;

  debug(`Using ${enterpriseExchangeRate} as the enterprise exchange rate.`);

  // Conversion of non-percentage currency values to the currency used for payment
  if (rubrics.length) {
    rubrics.forEach(rubric => {
      if (rubric.value && !rubric.is_percent && !rubric.is_seniority_bonus) {
        rubric.value *= enterpriseExchangeRate;
      }
    });
  }

  const iprCurrencyId = periodData.currency_id;

  return Promise.all(employees.map(async (employee) => {
    const option = {
      dateFrom : periodData.dateFrom,
      dateTo : periodData.dateTo,
      employeeUuid : employee.employee_uuid,
    };

    const [exchangeIpr, advantages] = await Promise.all([
      Exchange.getExchangeRate(enterpriseId, iprCurrencyId, new Date()),
      EmployeeData.lookupEmployeeAdvantages(employee.employee_uuid),
    ]);

    const iprExchangeRate = exchangeIpr.rate;
    const advantagesEmployee = (advantages || []);

    const dataConfiguration = await getConfig.getConfigurationData(payrollConfigurationId, option);
    const dataManaged = manageConfig.manageConfigurationData(dataConfiguration, option);

    const iprScales = dataManaged[4];
    const daysPeriod = dataManaged[7][0];
    const offDays = dataManaged[5];
    const holidays = dataManaged[2];
    const nbHolidays = dataManaged[6].length;
    const nbOffDays = dataManaged[5].length;

    const allRubrics = [];
    const paymentUuid = db.uuid();

    // Calculate the employee's daily salary.  If the employee is salaried, the salary is divided by
    // the working days of the period to get the daily salary.
    // NOTE(@jniles) - for some reason, this doesn't take into account the holidays or "off days"
    const dailySalary = employee.individual_salary
      ? (employee.individual_salary / daysPeriod.working_day) : (
        employee.grade_salary / daysPeriod.working_day);

    // the number of valid working days in the payroll period.
    const workingDays = (daysPeriod.working_day - (nbHolidays + nbOffDays));
    const workingDayCost = dailySalary * (daysPeriod.working_day - (nbHolidays + nbOffDays));

    // the number of dependents an employee has.  This affects the rubrics related to family allowance
    // and tax purposes.
    const nbChildren = employee.nb_enfant;

    // determine the seniority of the employee by computing the difference between their hiring date and present date.
    const yearsOfSeniority = moment(periodData.dateTo).diff(moment(employee.date_embauche), 'years');

    /**
    * Some institutions allocate a percentage of the daily salary for off-day and holiday payments.
    * The rate is calculated by determining the equivalent value of the daily wage based on
    * the specified percentage for off-days or holidays.
    */
    let offDaysCost = 0;
    const offDaysElements = offDays.map(offDay => {
      const offDaysValue = (dailySalary * offDay.percent_pay) / 100;

      // accumulate the total offDaysCost for totalling later
      offDaysCost += offDaysValue;

      return [
        offDay.id,
        offDay.percent_pay,
        paymentUuid,
        offDay.label,
        util.roundDecimal(offDaysValue * enterpriseExchangeRate, DECIMAL_PRECISION),
      ];
    });

    let holidaysCost = 0;
    const holidaysElements = holidays.map(holiday => {
      const holidayValue = (dailySalary * holiday.percentage * holiday.numberOfDays) / 100;

      // accumulate the total holiday cost for totalling later.
      holidaysCost += holidayValue;
      return [holiday.id,
        holiday.numberOfDays,
        holiday.percentage,
        paymentUuid,
        holiday.label,
        util.roundDecimal(holidayValue * enterpriseExchangeRate, DECIMAL_PRECISION),
      ];
    });

    const automaticRubric = (coefficient, variables) => variables.reduce((total, next) => total * next, coefficient);

    /**
    * Recalculates the base salary to account for holiday or vacation periods.
    * If the percentages for these periods are 100% of the base salary,
    * the base salary remains unchanged, as defined in the grade table.
    *
    * The total costs include the working day cost, off-day cost, and holiday cost.
    */
    const totalCosts = workingDayCost + offDaysCost + holidaysCost;

    debug(`Computed the working day cost as ${workingDayCost}.`);
    debug(`Computed the off day cost as ${offDaysCost}.`);
    debug(`Computed the holiday cost as ${holidaysCost}.`);

    // basic salary is expressed in the enterprise currency
    const basicSalary = util.roundDecimal(totalCosts * enterpriseExchangeRate, DECIMAL_PRECISION);

    debug(`Employee basic salary before rubric additions is ${basicSalary}.`);

    rubrics.forEach(rubric => {
      rubric.result = 0;

      // calculate the employee advantages
      const matchingEmployeeAdvantage = advantagesEmployee.find(
        advantage => rubric.rubric_payroll_id === advantage.rubric_payroll_id,
      );

      if (matchingEmployeeAdvantage) {
        rubric.result = util.roundDecimal(
          matchingEmployeeAdvantage.value * enterpriseExchangeRate,
          DECIMAL_PRECISION,
        );
      }

      debug(`Employee advantage value is ${rubric.result}.`);

      // calculate the seniorty bonus for the employee
      if (rubric.is_seniority_bonus === 1) {
        const seniorityElements = [yearsOfSeniority, rubric.value];
        rubric.result = util.roundDecimal(
          automaticRubric(basicSalary, seniorityElements),
          DECIMAL_PRECISION,
        );

        debug(`Employee seniority brings the value to ${rubric.result} due to ${yearsOfSeniority} yrs of seniority.`);
      }

      // calculate the employee family allowance
      if (rubric.is_family_allowances === 1) {
        const allowanceElements = [nbChildren];
        rubric.result = automaticRubric(rubric.value, allowanceElements);
        debug(`Employee family bonus brings the value to ${rubric.result} by having ${nbChildren} children.`);
      }
    });

    // filter rubrics into categories - nontaxables, taxables, and taxesContributions
    // TODO(@jniles) - define each of these categories.  Is taxesContributions born by the institution?
    const nonTaxables = rubrics.filter(item => item.is_social_care);
    const taxables = rubrics.filter(item => !item.is_tax
      && !item.is_social_care
      && !item.is_membership_fee
      && !item.is_discount,
    );
    const taxesContributions = rubrics.filter(item => item.is_tax
      || item.is_membership_fee
      || item.is_discount,
    );

    // calculate the value of nontaxable rubrics
    let sumNonTaxable = 0;
    nonTaxables.forEach(nonTaxable => {
      if (!nonTaxable.is_seniority_bonus && !nonTaxable.is_family_allowances) {
        nonTaxable.result = nonTaxable.is_percent
          ? util.roundDecimal((basicSalary * nonTaxable.value) / 100, DECIMAL_PRECISION)
          : nonTaxable.result || nonTaxable.value;
      }

      sumNonTaxable += nonTaxable.result;
      allRubrics.push([paymentUuid, nonTaxable.rubric_payroll_id, nonTaxable.result]);
    });

    // calculate the value of taxable rubrics
    let sumTaxable = 0;
    taxables.forEach(taxable => {
      if (!taxable.is_seniority_bonus && !taxable.is_family_allowances) {
        taxable.result = taxable.is_percent
          ? util.roundDecimal((basicSalary * taxable.value) / 100, DECIMAL_PRECISION)
          : taxable.result || taxable.value;
      }
      sumTaxable += taxable.result;
      allRubrics.push([paymentUuid, taxable.rubric_payroll_id, taxable.result]);
    });

    const baseTaxable = basicSalary + sumTaxable;
    const grossSalary = basicSalary + sumTaxable + sumNonTaxable;

    debug(`In addition to base ${basicSalary}, the employee has ${sumTaxable} additions, totallying ${baseTaxable}.`);
    debug(`Additionally, the employee has ${sumNonTaxable} benefits that are not taxable.`);
    debug(`Therefore, taxes will be computed with ${baseTaxable} as base taxable salary.`);
    debug(`The employee gross salary is ${grossSalary}.`);

    let membershipFeeEmployee = 0;
    taxesContributions.forEach(taxContribution => {
      taxContribution.result = taxContribution.is_percent
        ? util.roundDecimal((baseTaxable * taxContribution.value) / 100, DECIMAL_PRECISION)
        : taxContribution.result || taxContribution.value;

      // Recovery of the value of the Membership Fee worker share
      if (taxContribution.is_membership_fee && taxContribution.is_employee) {
        membershipFeeEmployee = taxContribution.result;
      }
    });

    // NOTE(@jniles) - for some reaosn, the baseTaxable rate has the membership fee removed from it, which
    // implies it is not actually the base rate.
    const baseIpr = (baseTaxable - membershipFeeEmployee) * (iprExchangeRate / enterpriseExchangeRate);

    debug(`Employee base IPR tax rate: ${baseIpr}.`);
    // only apply IPR if scales for IPR exist.
    if (iprScales.length) {
      // Annual accummulation of Base IPR
      const annualCumulation = baseIpr * 12;
      let iprValue = calculation.iprTax(annualCumulation, iprScales);
      if (nbChildren > 0) {
        iprValue -= (iprValue * (nbChildren * 2)) / 100;
      }

      // Convert IPR value in selected currency
      iprValue = util.roundDecimal(iprValue * (enterpriseExchangeRate / iprExchangeRate), DECIMAL_PRECISION);

      if (taxesContributions.length) {
        // Set the IPR value on each taxable rubric that is marked "is_ipr"
        taxesContributions.forEach(taxContribution => {
          if (taxContribution.is_ipr) { taxContribution.result = iprValue; }
        });
      }
    }

    let sumTaxContributionEmp = 0;
    if (taxesContributions.length) {
      taxesContributions.forEach(taxContribution => {
        // Calculation of the sum of taxes and membership fee borne by the employee
        if (taxContribution.is_employee) {
          sumTaxContributionEmp += taxContribution.result;
        }
        allRubrics.push([paymentUuid, taxContribution.rubric_payroll_id, taxContribution.result]);
      });
    }

    const netSalary = grossSalary - sumTaxContributionEmp;
    debug(`Employee net salary after taxes is ${netSalary}.`);

    const paymentData = {
      uuid : paymentUuid,
      employee_uuid : db.bid(employee.employee_uuid),
      payroll_configuration_id : payrollConfigurationId,
      currency_id : employee.currency_id,
      basic_salary : basicSalary,
      daily_salary : util.roundDecimal(dailySalary * enterpriseExchangeRate, DECIMAL_PRECISION),
      base_taxable : baseTaxable,
      working_day : workingDays,
      total_day : daysPeriod.working_day,
      gross_salary : grossSalary,
      net_salary : netSalary,
      amount_paid : 0,
      status_id : 2,
    };

    // accumulate all transactions
    const allTransactions = [{
      query : setPaymentDataSQL,
      params : [paymentData],
    }];

    if (allRubrics.length) {
      allTransactions.push({
        query : setRubricPaymentDataSQL,
        params : [allRubrics],
      });
    }

    if (holidaysElements.length) {
      allTransactions.push({
        query : setHolidayPaymentSQL,
        params : [holidaysElements],
      });
    }

    if (offDaysElements.length) {
      allTransactions.push({
        query : setOffDayPaymentSQL,
        params : [offDaysElements],
      });
    }

    return allTransactions;
  }));
}

exports.setConfig = setConfig;
