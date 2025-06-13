/**
 * @requires db
 * @requires moment
 * @requires Exchange
 * @requires util
 */

const debug = require('debug')('payroll:multiplePayroll:setConfiguration');
const moment = require('moment');
const db = require('../../../lib/db');
const Exchange = require('../../finance/exchange');
const util = require('../../../lib/util');

const { calculateIPRTaxRate } = require('./calculation');

const DECIMAL_PRECISION = 2;

/**
 * @function config
 *
 * @description
 * This controller allows to initialize the payment configuration for an employee,
 * the data of this configuration comes from the manual configuration,
 */
async function config(req, res, next) {
  const { data } = req.body;

  const transaction = db.transaction();
  const currencyId = req.session.enterprise.currency_id;
  const enterpriseId = req.session.enterprise.id;

  // if tax IPR is not defined, use the enterprie currency id
  const iprCurrencyId = data.iprScales.length ? data.iprScales[0].currency_id : currencyId;

  const { iprScales, employee, periodDateTo } = data;
  const payrollConfigurationId = req.params.id;
  const paymentUuid = db.uuid();

  // reducer function for multiplying elements of an array together.
  const automaticRubric = (coefficient, variables) => variables.reduce((total, item) => total * item, coefficient);

  // End Date of Payroll Period
  const allRubrics = [];

  // FIXME(@jniles) - in our test data, "code" is the employee name.
  debug('Working on employee: %s', employee.code);

  try {
    debug('Looking up exchange rates.');

    const [exchange, exchangeIpr] = await Promise.all([
      Exchange.getExchangeRate(enterpriseId, data.currency_id, new Date()),
      Exchange.getExchangeRate(enterpriseId, iprCurrencyId, new Date()),
    ]);

    const enterpriseExchangeRate = currencyId === data.currency_id ? 1 : exchange.rate;

    const iprExchangeRate = exchangeIpr.rate;

    debug(`Using the rates: IPR: ${iprExchangeRate}; enterprise: ${enterpriseExchangeRate}.`);

    // calculate the daily wage of the employee
    const totalDayPeriod = data.daysPeriod.working_day;
    const dailySalary = employee.individual_salary
      ? (employee.individual_salary / totalDayPeriod)
      : (employee.basic_salary / totalDayPeriod);

    const workingDayCost = dailySalary * data.working_day;
    const nbChildren = employee.nb_enfant;

    // Calcul of Seniority date Between hiring_date and the end date of Period
    const yearsOfSeniority = moment(periodDateTo).diff(moment(employee.hiring_date), 'years');

    debug(`[${employee.code}] Seniority: ${yearsOfSeniority} years.`);
    debug(`[${employee.code}] Children: ${nbChildren}`);
    debug(`[${employee.code}] Daily Salary: ${dailySalary}`);

    /**
     * Some institution allocates a percentage for the offday and holiday payment.
     * the calculation of this rate is found by calculating the equivalence of the daily wage with
     * the percentage of the offday or holiday.
    */
    let offDaysCost = 0;
    const offDaysElements = data.offDays.map(offDay => {
      const offDayValue = ((dailySalary * offDay.percent_pay) / 100);
      offDaysCost += offDayValue;
      return [offDay.id, offDay.percent_pay, paymentUuid, offDay.label, offDayValue];
    });

    let holidaysCost = 0;
    const holidaysElements = data.holidays.map(holiday => {
      const holidayValue = ((dailySalary * holiday.percentage * holiday.numberOfDays) / 100);
      holidaysCost += holidayValue;
      return [
        holiday.id,
        holiday.numberOfDays,
        holiday.percentage,
        paymentUuid,
        holiday.label,
        holidayValue,
      ];
    });

    /*
     * Recalculation of base salary on the basis of any holiday or vacation period,
     * where the percentages are respectively equal to 100% of the basic salary will
     * remain equal to that defined at the level of the Holiday table
     */

    const basicSalary = (workingDayCost + offDaysCost + holidaysCost) * enterpriseExchangeRate;

    const sql = `
      SELECT config_rubric_item.id, config_rubric_item.config_rubric_id, config_rubric_item.rubric_payroll_id,
        payroll_configuration.label AS PayrollConfig, rubric_payroll.*
      FROM config_rubric_item
      JOIN rubric_payroll ON rubric_payroll.id = config_rubric_item.rubric_payroll_id
      JOIN payroll_configuration ON payroll_configuration.config_rubric_id = config_rubric_item.config_rubric_id
      WHERE payroll_configuration.id = ?  AND (rubric_payroll.debtor_account_id IS NOT NULL)
      AND (rubric_payroll.expense_account_id IS NOT NULL);
    `;

    const rubrics = await db.exec(sql, [payrollConfigurationId]);

    let sumNonTaxable = 0;
    let sumTaxable = 0;
    let sumTaxContributionEmp = 0;
    let membershipFeeEmployee = 0;

    let nonTaxables = [];
    let taxables = [];
    let taxesContributions = [];

    if (rubrics.length) {
      rubrics.forEach(rubric => {
        // Conversion of non-percentage currency values to the currency used for payment
        if (rubric.value && !rubric.is_percent && !rubric.is_seniority_bonus) {
          rubric.value *= enterpriseExchangeRate;
        }

        // Initialize values for rubrics that are not automatically calculated
        rubric.result = util.roundDecimal(data.value[rubric.abbr], DECIMAL_PRECISION);

        // Automatic calcul of Seniority_Bonus & Family_Allowances
        if (rubric.is_seniority_bonus === 1) {
          const seniorityElements = [yearsOfSeniority, rubric.value];

          rubric.result = automaticRubric(basicSalary, seniorityElements);
        }

        if (rubric.is_family_allowances === 1) {
          const allowanceElements = [nbChildren];
          rubric.result = automaticRubric(rubric.value, allowanceElements);
        }
      });

      // Filtering nontaxable Rubrics
      nonTaxables = rubrics.filter(item => item.is_social_care);

      // Filtering taxable Rubrics
      taxables = rubrics.filter(item => (item.is_tax !== 1
              && item.is_discount !== 1
              && item.is_social_care !== 1
              && item.is_membership_fee !== 1));

      // Filtering all taxes and contributions that is calculated from the taxable base
      taxesContributions = rubrics.filter(
        item => (item.is_tax || item.is_membership_fee || item.is_discount === 1),
      );
    }

    // Calcul value for nontaxable and automatically calculated Expected Seniority_bonus & Family_allowances
    if (nonTaxables.length) {
      nonTaxables.forEach(nonTaxable => {
        if (!nonTaxable.is_seniority_bonus && !nonTaxable.is_family_allowances) {
          nonTaxable.result = nonTaxable.is_percent
            ? util.roundDecimal((basicSalary * nonTaxable.value) / 100, DECIMAL_PRECISION)
            : (nonTaxable.result || nonTaxable.value);
        }

        sumNonTaxable += nonTaxable.result;
        allRubrics.push([paymentUuid, nonTaxable.rubric_payroll_id, nonTaxable.result]);
      });
    }

    // Calcul value for taxable and automatically calculated Expected Seniority_bonus & Family_allowances
    if (taxables.length) {
      taxables.forEach(taxable => {
        if (!taxable.is_seniority_bonus && !taxable.is_family_allowances) {
          taxable.result = taxable.is_percent
            ? util.roundDecimal((basicSalary * taxable.value) / 100, DECIMAL_PRECISION)
            : (taxable.result || taxable.value);
        }

        sumTaxable += taxable.result;
        allRubrics.push([paymentUuid, taxable.rubric_payroll_id, taxable.result]);
      });
    }

    const baseTaxable = basicSalary + sumTaxable;

    const grossSalary = basicSalary + sumTaxable + sumNonTaxable;

    if (taxesContributions.length) {
      taxesContributions.forEach(taxContribution => {
        taxContribution.result = taxContribution.is_percent
          ? util.roundDecimal((baseTaxable * taxContribution.value) / 100, DECIMAL_PRECISION)
          : (taxContribution.result || taxContribution.value);

        // Recovery of the value of the Membership Fee worker share
        if (taxContribution.is_membership_fee && taxContribution.is_employee) {
          membershipFeeEmployee = taxContribution.result;
        }
      });
    }

    const baseIpr = ((baseTaxable - membershipFeeEmployee) * (iprExchangeRate / enterpriseExchangeRate));

    // Annual cumulation of Base IPR
    const annualCumulation = baseIpr * 12;

    debug(`[${employee.code}] Base IPR Rate: ${baseIpr}`);

    let iprValue = 0;

    if (iprScales.length) {
      iprValue = calculateIPRTaxRate(annualCumulation, iprScales);

      // decrease the tax rate for each child.
      if (nbChildren > 0) {
        iprValue -= (iprValue * (nbChildren * 2)) / 100;
      }

      debug(`[${employee.code}] Raw IPR value: ${iprValue}`);

      // Convert IPR value in selected Currency
      iprValue = util.roundDecimal(iprValue * (enterpriseExchangeRate / iprExchangeRate), DECIMAL_PRECISION);

      debug(`[${employee.code}] Final IPR value: ${iprValue}`);

      if (taxesContributions.length) {
        taxesContributions.forEach(taxContribution => {
          // Set the result of IPR calculation
          if (taxContribution.is_ipr) {
            taxContribution.result = iprValue;
          }

          // Calculation of the sum of taxes and membership fee borne by the employee
          if (taxContribution.is_employee) { sumTaxContributionEmp += taxContribution.result; }

          allRubrics.push([paymentUuid, taxContribution.rubric_payroll_id, taxContribution.result]);
        });
      }
    } else if (taxesContributions.length) {
      taxesContributions.forEach(taxContribution => {
        // Calculation of the sum of taxes and membership fee borne by the employee
        if (taxContribution.is_employee) {
          sumTaxContributionEmp += taxContribution.result;
        }

        allRubrics.push([paymentUuid, taxContribution.rubric_payroll_id, taxContribution.result]);
      });

    }

    const netSalary = grossSalary - sumTaxContributionEmp;

    debug(`[${employee.code}] : Net Salary: ${netSalary}, Gross Salary: ${grossSalary}, Base Taxable: ${baseTaxable}`);

    const paymentData = {
      uuid : paymentUuid,
      employee_uuid : db.bid(employee.uuid),
      payroll_configuration_id : payrollConfigurationId,
      currency_id : data.currency_id,
      basic_salary : basicSalary,
      base_taxable : baseTaxable,
      daily_salary : dailySalary,
      total_day : totalDayPeriod,
      working_day : data.working_day,
      gross_salary : grossSalary,
      net_salary : netSalary,
      amount_paid : 0,
      status_id : 2,
    };

    const deletePaymentData = 'DELETE FROM payment WHERE employee_uuid = ? AND payroll_configuration_id = ?';
    const setPaymentData = 'INSERT INTO payment SET ?';
    const setRubricPaymentData = `INSERT INTO rubric_payment (payment_uuid, rubric_payroll_id, value)
            VALUES ?`;
    const setHolidayPayment = `INSERT INTO holiday_payment
            (holiday_id, holiday_nbdays, holiday_percentage, payment_uuid, label, value) VALUES ?`;
    const setOffDayPayment = `INSERT INTO offday_payment
            (offday_id, offday_percentage, payment_uuid, label, value) VALUES ?`;

    transaction
      .addQuery(deletePaymentData, [db.bid(employee.uuid), payrollConfigurationId])
      .addQuery(setPaymentData, [paymentData]);

    if (allRubrics.length) {
      transaction.addQuery(setRubricPaymentData, [allRubrics]);
    }

    if (holidaysElements.length) {
      transaction.addQuery(setHolidayPayment, [holidaysElements]);
    }

    if (offDaysElements.length) {
      transaction.addQuery(setOffDayPayment, [offDaysElements]);
    }

    await transaction.execute();
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
}

// Configure Payment for Employee
exports.config = config;
