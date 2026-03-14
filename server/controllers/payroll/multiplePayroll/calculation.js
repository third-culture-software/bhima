/**
 * @requires util
 */
const util = require('../../../lib/util');

const debug = require('debug')('payroll:calculateIPRTaxRate');

/**
 * @function calculateIPRTaxRate
 *
 * @description
 * This function is used to calculate the value of the IPR tax, and has to set the annual value of
 * the IPR base as well as the table of the different IPR brackets, and returns the calculated IPR value.
 *
 * Note that this assumes that the currency in the tax table is the same as the payment currency.
 */
function calculateIPRTaxRate(amount, iprScales) {

  debug(`Locating ${amount} in ${iprScales.length} IPR scales`);

  // Find the applicable tax scale using find() for better performance and readability
  const applicableScale = iprScales.find(scale => (
    amount > scale.tranche_annuelle_debut
    && amount <= scale.tranche_annuelle_fin));

  if (!applicableScale) {
    debug('No applicable IPR scale found for the given annual cumulation.');
    throw new Error(`No applicable IPR scale found for ${amount} annual cumulation.`);
  }

  const initial = applicableScale.tranche_annuelle_debut;
  const rate = applicableScale.rate / 100;

  // grab the bracket directly below this tax bracket
  const scaleIndex = iprScales.indexOf(applicableScale);
  const previousScale = iprScales[scaleIndex - 1];

  // previous amount if exists, otherwise 0
  const cumul = previousScale ? previousScale.cumul_annuel : 0;
  const iprValue = (((amount - initial) * rate) + cumul) / 12;

  debug(`Computed the IPR Tax rate to be: ${iprValue}`);

  return iprValue;
}

/**
 * Calculate final IPR value based on annual income, tax scales and number of children.
 * Applies children reduction, currency conversion and rounding.
 *
 * @param {number} annualCumulation - Employee annual taxable income.
 * @param {Array<Object>} iprScales - Progressive tax scales used to calculate the IPR.
 * @param {number} nbChildren - Number of dependent children.
 * @param {number} enterpriseExchangeRate - Exchange rate of the enterprise currency.
 * @param {number} iprExchangeRate - Exchange rate used for IPR calculation.
 * @param {number} DECIMAL_PRECISION - Number of decimal places for rounding.
 *
 * @returns {number} Final calculated IPR value (never negative).
 *
 * @throws {Error} If iprScales is not a valid non-empty array.
 */
function calculateFinalIPR(
    annualCumulation,
    iprScales,
    nbChildren,
    enterpriseExchangeRate,
    iprExchangeRate,
    DECIMAL_PRECISION,
) {
  if (!annualCumulation || annualCumulation <= 0) {
    return 0;
  }

  if (!Array.isArray(iprScales) || iprScales.length === 0) {
    throw new Error('Invalid IPR scales');
  }

  // Validate iprExchangeRate
  if (typeof iprExchangeRate !== 'number' || iprExchangeRate <= 0) {
    throw new Error('iprExchangeRate must be a positive number');
  }

  // 1️. Calculate raw IPR from tax scales
  let iprValue = calculateIPRTaxRate(annualCumulation, iprScales);

  if (iprValue <= 0) {
    return 0;
  }

  // 2️. Apply children reduction
  if (nbChildren > 0) {
     iprValue -= (iprValue * (nbChildren * 2)) / 100;
  }

  iprValue = util.roundDecimal(iprValue * (enterpriseExchangeRate / iprExchangeRate), DECIMAL_PRECISION);

  // 3️. Prevent negative tax
  return Math.max(0, iprValue);
}

module.exports = { calculateIPRTaxRate, calculateFinalIPR };
