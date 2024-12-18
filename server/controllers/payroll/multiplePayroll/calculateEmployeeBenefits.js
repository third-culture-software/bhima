const debug = require('debug')('payroll:commitments:benefits');
const db = require('../../../lib/db');
const common = require('./common');

/**
  * @function calculateEmployeeBenefits
  *
  * @description
  * Filters rubrics for payroll tax rubrics and creates the vouchers and transactions that apply to those
  * kinds of rubrics. Returns an array of transactions.description
  *
  * TODO(@jniles) - for some reason, Benefits are included in the same voucher as the base salary "commitment".  This
  * is why we have the "salaryVoucherUuid" as a parameter here.
  *
  * The options parameter should contain "sharedI18nProps" and "sharedVoucherProps"
  */
function calculateEmployeeBenefits(employee, rubrics, salaryVoucherUuid, options = {}) {
  const benefits = rubrics.filter(common.isBenefitRubric);

  debug(`Employee ${employee.display_name} has ${benefits.length} rubric benefits.`);

  // add voucher items for each benefit item
  return benefits.map(rubric => {
    const voucherItemDescription = common.fmtI18nDescription(options.lang, 'PAYROLL_RUBRIC.BENEFITS_ITEM_DESCRIPTION', {
      ...options.sharedI18nProps,
      amount : rubric.value,
      rubricLabel : rubric.label,
    });

    debug(`Recording benefits of ${rubric.value} for ${rubric.label} for ${employee.display_name}.`);

    return [
      db.uuid(),
      rubric.expense_account_id,
      rubric.value, // debit
      0, // credit
      salaryVoucherUuid,
      null,
      voucherItemDescription,
      employee.cost_center_id,
    ];
  });
}

module.exports = { calculateEmployeeBenefits };
