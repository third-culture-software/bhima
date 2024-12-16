/**
 * @description
 * This module contains functions that are common across different types of payroll operations.  In particular,
 * the classification of payroll rubrics used in the different styles of commitment() functions.  It should allow
 * for better test coverage and consolidation of rubric types.
 */

const util = require('../../../lib/util');

const DECIMAL_PRECISION = 2;

// FIXME(@jniles) - why are we rounding each time?  Won't this accumulate errors?
// On the other hand, maybe it doesn't make sense to pay an employee half a cent,
// since the majority of these transactions will be paid cash.
function sumRubricValues(rubrics) {
  return rubrics.reduce(
    (total, rubric) => total + util.roundDecimal(rubric.value, DECIMAL_PRECISION),
    0,
  );
}

function sumRubricTotals(rubrics) {
  return rubrics.reduce(
    (total, rubric) => total + util.roundDecimal(rubric.totals, DECIMAL_PRECISION),
    0,
  );

}
// used in every rubric to filter out 0 or negative value rubrics.
const isPositive = rubric => rubric.totals > 0;

// NOTE(@jniles) both commitment.js and groupedCommitment.js use the .totals
// key to accummulate rubric values.
// However, commitmentByEmployee does not use an accumulator and instead
// uses the rubic values directly.
// uses totals, not value
function isBenefitRubric(rubric) {
  return isPositive(rubric) && rubric.is_discount !== 1;
}

function isWitholdingRubric(rubric) {
  return isPositive(rubric) && rubric.is_discount && rubric.is_employee;
}

function isPayrollTaxRubric(rubric) {
  return isPositive(rubric)
    && rubric.is_employee !== 1
    && rubric.is_discount === 1
    && rubric.is_linked_pension_fund === 0;
}

function isPensionFundRubric(rubric) {
  return isPositive(rubric)
    && rubric.is_employee !== 1
    && rubric.is_discount === 1
    && rubric.is_linked_pension_fund === 1;
}

module.exports = {
  sumRubricValues,
  sumRubricTotals,
  isBenefitRubric,
  isWitholdingRubric,
  isPayrollTaxRubric,
  isPensionFundRubric,
};
