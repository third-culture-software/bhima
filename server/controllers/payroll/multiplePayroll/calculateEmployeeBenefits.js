const debug = require('debug')('payroll:commitments:benefits');
const db = require('../../../lib/db');
const util = require('../../../lib/util');
const common = require('./common');

const DECIMAL_PRECISION = 2;

/**
  * @function calculateEmployeeBenefits
  *
  * @description
  * Filters rubrics for benefits rubrics and creates the vouchers and transactions that apply to those
  * kinds of rubrics. Returns an array of arrays to be added to the voucher_item portion of the commitment
  * transaction.
  *
  * NOTE(@jniles) - for some reason, benefits are included in the same voucher as the base salary "commitment".  This
  * is why we have the "salaryVoucherUuid" as a parameter here.
  *
  * The options parameter should contain "lang", "sharedI18nProps" and "sharedVoucherProps"
  */
function calculateEmployeeBenefits(employee, rubrics, salaryVoucherUuid, options = {}) {
  const benefits = rubrics.filter(common.isBenefitRubric);

  debug(`Employee ${employee.display_name} has ${benefits.length} rubric benefits.`);

  // add voucher items for each benefit item
  return benefits.map(rubric => {
    const voucherItemDescription = common.fmtI18nDescription(options.lang, 'PAYROLL_RUBRIC.BENEFITS_ITEM_DESCRIPTION', {
      ...options.sharedI18nProps,
      // NOTE(@jniles): .toFixed() is required to make this look nice because we do JS math
      // which is imprecise by nature. Ideally, we should be using the currency filter like we do in
      // handlebars templates, but this will do for now.
      amount :  util.roundDecimal(rubric.value, DECIMAL_PRECISION),
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
