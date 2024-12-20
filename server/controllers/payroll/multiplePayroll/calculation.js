/**
 * @function iprTax
 *
 * @description
 * This function is used to calculate the value of the IPR tax, and has to set the annual value of
 * the IPR base as well as the table of the different IPR slices, and returns the calculated IPR value.
 *
 */
function iprTax(annualCumulation, iprScales) {
  let scaleIndice;

  iprScales.forEach((scale, ind) => {
    if (annualCumulation > scale.tranche_annuelle_debut && annualCumulation <= scale.tranche_annuelle_fin) {
      scaleIndice = ind;
    }
  });

  const initial = iprScales[scaleIndice].tranche_annuelle_debut;
  const rate = iprScales[scaleIndice].rate / 100;

  const cumul = (iprScales[scaleIndice - 1]) ? iprScales[scaleIndice - 1].cumul_annuel : 0;
  const iprValue = (((annualCumulation - initial) * rate) + cumul) / 12;

  return iprValue;
}

exports.iprTax = iprTax;
