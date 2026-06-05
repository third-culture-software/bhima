const TU = require('../TestUtils');

const fiscalYearSelect = require('./bhFiscalYearSelect');

/**
 *
 * @param fiscalYear
 * @param period
 */
async function set(fiscalYear, period) {
  await fiscalYearSelect.set(fiscalYear);

  // @todo : fix form used by this page to use the regular bh-period-select
  //         mechanisms so that bhPeriodSelect can be used.
  return TU.select('$ctrl.selectedPeriod', period);
}

module.exports = { set };
