const debug = require('debug')('payroll:calculateIPRTaxRate');

/**
 * @function calculateIPRTaxRate
 *
 * @description
 * This function is used to calculate the value of the IPR tax, and has to set the annual value of
 * the IPR base as well as the table of the different IPR brackets, and returns the calculated IPR value.
 *
 * Note that this assumes that the currency in the tax tabe is the same as the payment currency.
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

module.exports = { calculateIPRTaxRate };
