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

const { calculateFinalIPR } = require('./calculation');
const { processRubric, processRubricGroup } = require('./processRubric');

const DECIMAL_PRECISION = 2;

/**
 * @function config
 *
 * @description
 * This controller allows to initialize the payment configuration for an employee,
 * the data of this configuration comes from the manual configuration,
 */
async function config(req, res) {
  const { data } = req.body;

  // Validate payload existence
  if (!data) throw new Error('Payroll data is missing');
  if (!data.daysPeriod || data.daysPeriod.working_day <= 0) throw new Error('Invalid number of working days in period');
  if (data.working_day < 0) throw new Error('Invalid number of worked days');
  if (!data.periodDateTo) throw new Error('Payroll period end date is missing');

  const transaction = db.transaction();
  const currencyId = req.session.enterprise.currency_id;
  const enterpriseId = req.session.enterprise.id;

  ['offDays', 'holidays'].forEach(field => {
    if (!Array.isArray(data[field])) throw new Error(`${field} must be an array`);
  });


  // if tax IPR is not defined, use the enterprie currency id
  const iprCurrencyId = data.iprScales.length ? data.iprScales[0].currency_id : currencyId;

  const { iprScales, employee, periodDateTo } = data;

  // ─────────────────────────────
  // Employee validation
  // ─────────────────────────────
  if (!employee) throw new Error('Employee data is missing');
  if (!employee.uuid) throw new Error('Employee identifier is missing');
  if (!employee.hiring_date) throw new Error('Employee hiring date is missing');
  if (employee.individual_salary == null && employee.basic_salary == null) throw new Error('Basic salary or individual salary is required');
  if (employee.nb_enfant != null && employee.nb_enfant < 0) throw new Error('Invalid number of children');

  const payrollConfigurationId = req.params.id;
  const paymentUuid = db.uuid();
  
  // End Date of Payroll Period
  const allRubrics = [];

  // FIXME(@jniles) - in our test data, "code" is the employee name.
  debug('Working on employee: %s', employee.code);

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

  if (!rubrics.length) throw new Error('No payroll rubrics found');

  // Ensure data.value is always an object to prevent TypeError when accessing rubric values
  const dataValue = data.value ?? {};

  rubrics.forEach(rubric => {
    rubric.result = processRubric(rubric, {
      enterpriseExchangeRate,
      basicSalary,
      yearsOfSeniority,
      nbChildren,
      inputValue: dataValue[rubric.abbr],
      DECIMAL_PRECISION
    });
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

  // Calcul value for nontaxable and automatically calculated Expected Seniority_bonus & Family_allowances
  const resultNonTaxables = processRubricGroup(nonTaxables, { basicSalary, paymentUuid, DECIMAL_PRECISION });

  sumNonTaxable = resultNonTaxables.sum;
  allRubrics.push(...resultNonTaxables.dbEntries);

  // Calcul value for taxable and automatically calculated Expected Seniority_bonus & Family_allowances
  const resultTaxables = processRubricGroup(taxables, { basicSalary, paymentUuid, DECIMAL_PRECISION });

  sumTaxable = resultTaxables.sum;
  allRubrics.push(...resultTaxables.dbEntries);

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

    iprValue = calculateFinalIPR(
      annualCumulation,
      iprScales,
      nbChildren,
      enterpriseExchangeRate,
      iprExchangeRate,
      DECIMAL_PRECISION,
    );

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
}


// Configure Payment for Employee
exports.config = config;
