/**
 * @requires lib/util
 * @requires lib/db
 */

const util = require('../../../lib/util');
const db = require('../../../lib/db');
const common = require('./common');

/**
 * @method dataCommitment
 *
 * This function loops through all employees and accumulates their salaries, benefits, pension, and withholdings
 * in arrays that are handed back to the caller function.  It does similar work to the calculate*()
 * (e.g. calculateEmployeePension) payroll functions, but those functions directly return executable SQL statements,
 * whereas this one returns an array that can be passed through to a `params` call.
 *
 * Additionally, this function keeps track of the running totals of all employee transactions, whereas the
 * calculate*() functions concern themselves with dealing with only a single employee at a time.
 *
 * TODO(@jniles) - this functionality can be merged with the calculate*() functions so that we are not doing the work
 * twice.  Ideally, we would process each employee, call a calculate() function on them, then do a sum() to get there
 * totals.  This allows us to reuse the same code to compute withholdings/benefits/pensions/etc while still creating
 * aggregate transactions.
 *
 * This function takes as input a list of employees and calculates the following:
 * - Total base salaries
 * - Total benefits per employee
 * - Total deductions (retentions) from payments for each employee
 *
 * It returns a list of transaction to be executed, the calculated benefits, the calculated deductions,
 * and the pension calculations.
*/
function dataCommitment(employees, rubrics, exchangeRates, identificationCommitment) {
  const transactions = [];
  let totalCommitments = 0;
  let totalBasicSalaries = 0;

  const {
    voucherCommitmentUuid,
    voucherWithholdingUuid,
    descriptionCommitment,
    descriptionWithholding,
    voucherPensionFundAllocationUuid,
    descriptionPensionFund,
  } = identificationCommitment;

  const employeesBenefitsItem = [];
  const employeesWithholdingItem = [];
  const employeesPensionFundsItem = [];

  // Create a map of exchange rates
  const exchangeRateMap = exchangeRates.reduce((map, exchange) => {
    map[exchange.currency_id] = exchange.rate;
    return map;
  }, {});

  // loops through employees and accumulates SQL statements recording the benefits, withholdings, and pension associated
  // with each employee into the transaction array.
  employees.forEach(employee => {
    const paymentUuid = db.bid(employee.payment_uuid);

    // FIXME(@jniles) - this gets executed for every employee, even though it is not an employee-specific
    // transaction.  It's linked to the payment period.  It should be instead moved to somewhere that
    // deals with the payment periods, not the employees.
    transactions.push({
      query : 'UPDATE payment set status_id = 3 WHERE uuid = ?',
      params : [paymentUuid],
    });

    // exchange rate if the employee.currency is equal enterprise currency
    const exchangeRate = exchangeRateMap[employee.currency_id] || 1;

    // make the gross salary match the correct currency
    const conversionGrossSalary = employee.gross_salary / exchangeRate;

    // conversion in case the employee has been configured with a currency other than the enterprise's currency
    // these
    totalCommitments += employee.gross_salary / exchangeRate;
    totalBasicSalaries += employee.basic_salary / exchangeRate;

    employeesBenefitsItem.push([
      db.uuid(),
      employee.account_id,
      0,
      conversionGrossSalary,
      voucherCommitmentUuid,
      db.bid(employee.creditor_uuid),
      `${descriptionCommitment} (${employee.display_name})`,
      null,
    ]);

    const employeeRubrics = rubrics.filter(rubric => (employee.employee_uuid === rubric.employee_uuid));

    if (employeeRubrics.length) {

      // get expenses borne by the employee
      const employeeWithholdings = employeeRubrics.filter(common.isWithholdingRubric);

      const totalEmployeeWithholdings = common.sumRubricValues(employeeWithholdings);

      employeesWithholdingItem.push([
        db.uuid(),
        employee.account_id,
        util.roundDecimal(totalEmployeeWithholdings, 2),
        0,
        voucherWithholdingUuid,
        db.bid(employee.creditor_uuid),
        `${descriptionWithholding} (${employee.display_name})`,
        null,
      ]);

      // TODO(@jniles) - why filter these withholdings again?
      // What does the is_associated_employee do?
      employeeWithholdings
        .filter(rubric => (rubric.is_associated_employee === 1))
        .forEach(rubric => {
          employeesWithholdingItem.push([
            db.uuid(),
            rubric.debtor_account_id,
            0,
            util.roundDecimal(rubric.value, 2),
            voucherWithholdingUuid,
            db.bid(employee.creditor_uuid),
            `${descriptionWithholding} (${employee.display_name})`,
            null,
          ]);
        });

      // pension funds
      // FIXME(@jniles) - why is this definition of "pension fund" different from common.isPensionFundRubric()?
      const employeePensionFunds = employeeRubrics.filter(rubric => (rubric.is_linked_pension_fund));

      employeePensionFunds.forEach(pensionFund => {
        employeesPensionFundsItem.push([
          db.uuid(),
          pensionFund.debtor_account_id,
          0,
          util.roundDecimal(pensionFund.value, 2),
          voucherPensionFundAllocationUuid,
          db.bid(employee.creditor_uuid),
          `${descriptionPensionFund} (${employee.display_name})`,
          null,
        ]);
      });
    }
  });

  const data = {
    transactions,
    employeesBenefitsItem,
    employeesWithholdingItem,
    employeesPensionFundsItem,
    totalCommitments,
    totalBasicSalaries,
  };

  return data;
}

exports.dataCommitment = dataCommitment;
