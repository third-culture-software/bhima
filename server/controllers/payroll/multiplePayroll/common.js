/**
 * @description
 * This module contains functions that are common across different types of payroll operations.  In particular,
 * the classification of payroll rubrics used in the different styles of commitment() functions.  It should allow
 * for better test coverage and consolidation of rubric types.
 */

const util = require('../../../lib/util');
const i18n = require('../../../lib/helpers/translate');

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

function isBenefitRubric(rubric) {
  return rubric.is_discount !== 1;
}

function isWithholdingRubric(rubric) {
  return rubric.is_discount === 1 && rubric.is_employee === 1;
}

function isPayrollTaxRubric(rubric) {
  return rubric.is_employee !== 1
    && rubric.is_discount === 1
    && rubric.is_linked_pension_fund === 0;
}

function isPensionFundRubric(rubric) {
  return rubric.is_employee !== 1
    && rubric.is_discount === 1
    && rubric.is_linked_pension_fund === 1;
}

/**
  * @function fmtI18nDescription
  *
  * @description
  * Formats the description for the vouchers created by the pyaroll module by retrieving
  * the correctly translated text for a given language key, then templating in the
  * values for better legibility.sumRubricValues
  *
  * @param langKey {String} - the key for the i18n file (e.g. FR/EN)
  * @param descKey {String} - the key for the translated text (e.g. PAYROLL.XYZ)
  * @param opts {Object} - the mapping of
  */
function fmtI18nDescription(langKey, descKey, opts = {}) {
  const text = i18n(langKey)(descKey);
  return text
    // TODO(@jniles) - use the correct currency
    .replace('{{amount}}', opts.amount)
    .replace('{{employee.displayname}}', opts.displayname)
    .replace('{{employee.reference}}', opts.reference)
    .replace('{{rubric.label}}', opts.rubricLabel)
    .replace('{{paymentPeriod}}', opts.periodLabel);
}

/**
  * @function matchCostCenters
  *
  * @description
  * Creates a mapping function to associated cost centers based on the cost center's account_id.
  * You pass in the "matchAccountId" property to the function and the array of cost centers, and it will
  * return a function to do the matching.
  */
const matchCostCenters = (costCenters, matchAccountId) => ((rubric) => {
  const matchingCostCenter = costCenters.find(cc => cc.account_id === rubric[matchAccountId]);
  rubric.cost_center_id = matchingCostCenter?.cost_center_id;
  return rubric;
});

module.exports = {
  sumRubricValues,
  sumRubricTotals,
  isBenefitRubric,
  isWithholdingRubric,
  isPayrollTaxRubric,
  isPensionFundRubric,
  matchCostCenters,
  fmtI18nDescription,
};
