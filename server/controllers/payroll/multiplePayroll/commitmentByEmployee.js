/**
 * @method commitmentByEmployee
 *
 * This method makes it possible to edit the transactions relating to the payroll of employees
 * individually by employee, these are the transactions below the engagement,
 * the withholding as well as the social charges on the remuneration.
 *
 * @requires lib/util
 * @requires lib/db
 */

const debug = require('debug')('payroll:commitmentsByEmployee');
const db = require('../../../lib/db');
const common = require('./common');

const { calculateEmployeeBenefits } = require('./calculateEmployeeBenefits');
const { calculateEmployeePayrollTaxes } = require('./calculateEmployeePayrollTaxes');
const { calculateEmployeeWithholdings } = require('./calculateEmployeeWithholdings');
const { calculateEmployeePension } = require('./calculateEmployeePension');

const COMMITMENT_TYPE_ID = 15;

function commitmentByEmployee(employees, rubrics, configuration, exchangeRates) {
  const transactions = [];

  debug('Setting up transactions to process salaries of employees.');

  // unwrap configuration object
  const {
    periodPayroll, datePeriodTo, currencyId, userId,
    projectId, postingPensionFundTransactionType, lang,
  } = configuration;

  const accountPayroll = configuration.account_id;

  // Create a map of exchange rates
  const exchangeRateMap = exchangeRates.reduce((map, exchange) => {
    map[exchange.currency_id] = exchange.rate;
    return map;
  }, {});

  // Convert rubric values using the exchange rate map
  rubrics.forEach(rubric => {
    const exchangeRate = exchangeRateMap[rubric.currency_id] || 1;
    rubric.value /= exchangeRate;
  });

  debug(`Processing ${employees.length} employees.`);

  // loop through employees scheduled for payment this pay period and make salary commitments.
  employees.forEach(employee => {
    const paymentUuid = db.bid(employee.payment_uuid);

    // only include positive rubrics that are assigned to the employee
    const rubricsForEmployee = rubrics
      .filter(rubric => (rubric.employee_uuid === employee.employee_uuid))
      .filter(rubric => rubric.value > 0);

    debug(`Employee ${employee.displayName} has ${rubricsForEmployee.length} rubrics to allocate.`);

    // FIXME(@jniles) - this gets executed for every employee, even though it is not an employee-specific
    // transaction.  It's linked to the payment period.  It should be instead moved to somewhere that
    // deals with the payment periods, not the employees.
    // EDIT(@jniles) - It actually might be employee related. Leave this in until we get better clarity.
    transactions.push({
      query : 'UPDATE payment SET status_id = 3 WHERE uuid = ?',
      params : [paymentUuid],
    });

    // helper object to hold shared metadata for each voucher
    const sharedVoucherProps = {
      date : datePeriodTo,
      project_id : projectId,
      currency_id : currencyId,
      user_id : userId,
    };

    // base description parameters for i18n translation
    const sharedI18nProps = {
      displayname : employee.display_name,
      reference : employee.reference,
      rubricLabel : configuration.label,
      periodLabel : periodPayroll,
    };

    // first step: calcualte the employee's salary and write those transactions

    const salaryDescription = common.fmtI18nDescription(lang, 'PAYROLL_RUBRIC.SALARY_DESCRIPTION', {
      ...sharedI18nProps,
      amount : employee.gross_salary,
    });

    // salary voucher
    const salaryVoucher = {
      ...sharedVoucherProps,
      uuid : db.uuid(),
      type_id : COMMITMENT_TYPE_ID,
      description : salaryDescription,
      amount : employee.gross_salary,
    };

    transactions.push({ query : 'INSERT INTO voucher SET ?', params : [salaryVoucher] });

    const salaryVoucherItems = [];

    // TODO(@jniles): this description should make reference to the fact that it is the employee's Net Salary.
    // It should read something like:
    // eslint-disable-next-line
  // "Net salary commitment for ${employee.display_name} (${employee.reference}) in payment period ${periodPayroll}."
    salaryVoucherItems.push([
      db.uuid(),
      employee.account_id,
      0, // debit
      employee.gross_salary, // credit
      db.bid(salaryVoucher.uuid),
      db.bid(employee.creditor_uuid),
      salaryDescription,
      null,
    ]);

    // TODO(@jniles): this description should make reference to the fact that it is the employee's base salary.
    // It should read something like:
    // eslint-disable-next-line
  // "Base salary commitment for ${employee.display_name} (${employee.reference}) in payment period ${periodPayroll}."
    salaryVoucherItems.push([
      db.uuid(),
      accountPayroll,
      employee.basic_salary, // debit
      0, // credit
      db.bid(salaryVoucher.uuid),
      null,
      salaryDescription,
      employee.cost_center_id,
    ]);

    // shared options to be passed to each calculation function
    const options = { lang, sharedI18nProps, sharedVoucherProps };

    // Step 2: calculate any benefits on top of the employee salary

    // the difference between basic_salary and gross_salary are the benefits.
    const employeeBenefits = calculateEmployeeBenefits(employee, rubrics, salaryVoucher.uuid, options);
    salaryVoucherItems.push(...employeeBenefits);

    transactions.push({
      query : `INSERT INTO voucher_item (
            uuid, account_id, debit, credit, voucher_uuid, entity_uuid,
            description, cost_center_id) VALUES ?`,
      params : [salaryVoucherItems],
    });

    transactions.push({ query : 'CALL PostVoucher(?);', params : [salaryVoucher.uuid] });

    // Step 3: calculate any witholdings from employee salary

    const withholdings = calculateEmployeeWithholdings(employee, rubrics, options);
    transactions.push(...withholdings);

    // Step 4: calculate any taxes to be borne by the enterprise

    const taxes = calculateEmployeePayrollTaxes(employee, rubrics, options);
    transactions.push(...taxes);

    // Step 5: allocate pension funds if applicable

    const pension = calculateEmployeePension(employee, rubrics, postingPensionFundTransactionType, options);
    transactions.push(...pension);
  });

  return transactions;
}

exports.commitmentByEmployee = commitmentByEmployee;
