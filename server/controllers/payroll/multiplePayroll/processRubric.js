/**
 * @requires util
 */
const util = require('../../../lib/util');

/**
 * @function processRubric
 * @description Calculates the final value of a rubric.
 * Handles currency conversion and seniority/family calculations without using external functions.
 */
function processRubric(rubric, { 
  enterpriseExchangeRate, 
  basicSalary, 
  yearsOfSeniority, 
  nbChildren, 
  inputValue,
  DECIMAL_PRECISION = 2 
}) {
  
  // 1. Determine the reference value of the rubric
  // Using a constant to avoid modifying the original 'rubric' object (prevents recalculation errors)
  const baseValue = (rubric.value && !rubric.is_percent && !rubric.is_seniority_bonus)
    ? rubric.value * enterpriseExchangeRate
    : (rubric.value || 0);

  // 2. Initialize with the entered value (or 0 if absent)
  let result = util.roundDecimal(inputValue || 0, DECIMAL_PRECISION);

  // 3. Automatic calculation: Seniority Bonus
  // Logic: Basic salary * Years of seniority * Rubric value
  if (rubric.is_seniority_bonus === 1) {
    // result (intentionally not rounded)
    result = basicSalary * yearsOfSeniority * baseValue;
  }

  // 4. Automatic calculation: Family Allowances
  // Logic: Rubric value * Number of children
  if (rubric.is_family_allowances === 1) {
    // result (intentionally not rounded)
    result = baseValue * nbChildren;
  }

  return result;
}

/**
 * @function processRubricGroup
 * @description Processes a collection of rubrics, calculates percentage-based values, 
 * updates rubric objects by reference, and prepares data for SQL batch insertion.
 * @param {Array} group - Array of rubric objects to process.
 * @param {Object} params - Calculation parameters.
 * @param {Number} params.basicSalary - The employee's calculated basic salary.
 * @param {String} params.paymentUuid - Unique identifier for the current payment.
 * @param {Number} [params.DECIMAL_PRECISION=2] - Number of decimal places for rounding.
 * @returns {Object} An object containing the total sum, SQL entries, and the updated group.
 */
function processRubricGroup(group, { 
  basicSalary, 
  paymentUuid, 
  DECIMAL_PRECISION = 2 
}) {
  let sum = 0;
  const dbEntries = [];

  // Return empty structure if group is null or empty
  if (!group || !group.length) {
    return { sum, dbEntries, group: [] };
  }

  group.forEach(rubric => {
    /**
     * If the rubric hasn't been pre-calculated by automatic rules 
     * (like Seniority Bonus or Family Allowances in processRubric), 
     * we calculate its value here.
     */
    if (!rubric.is_seniority_bonus && !rubric.is_family_allowances) {
      rubric.result = rubric.is_percent
        ? util.roundDecimal((basicSalary * rubric.value) / 100, DECIMAL_PRECISION)
        : (rubric.result || rubric.value || 0);
    }

    // Accumulate total sum for this group
    sum += rubric.result;
    
    // Format entry for SQL bulk insert (matching table schema: payment_uuid, rubric_id, value)
    dbEntries.push([paymentUuid, rubric.rubric_payroll_id, rubric.result]);
  });

  // Return updated data to the controller
  return { sum, dbEntries, group };
}

module.exports = { 
  processRubric, 
  processRubricGroup
};