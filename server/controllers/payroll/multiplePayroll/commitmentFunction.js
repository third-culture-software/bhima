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
 * This function prepares the data required to process payment encumbrance transactions.
 * It takes as input a list of employees and calculates the following:
 * - Total base salaries
 * - Total benefits per employee
 * - Total deductions (retentions) from payments for each employee
 *
 * It returns a list of transaction to be executed, the calcualted benefits, the calcualed deductions,
 * and the pension calculations.
*/
function dataCommitment(employees, exchangeRates, rubrics, identificationCommitment) {
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
      // Get Expenses borne by the employee
      const employeeWithholdings = employeeRubrics.filter(rubric => (rubric.is_discount && rubric.is_employee));

      // FIXME(@jniles) - why are we rounding on each loop?  Why not round the whole thing?
      // We might be under or overcharging because of the repeated rounding!
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

      // PENSION FUNDS
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
