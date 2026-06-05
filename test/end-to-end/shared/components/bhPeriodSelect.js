const moment = require('moment');

const TU = require('../TestUtils');
const { by } = require('../TestUtils');

const periodSelector = '[data-bh-period-select]';

/**
 * Open the selections drop-down
 * @returns {Promise} for opening the selections drop-down
 */
async function openSelections() {
  await TU.waitForSelector('[data-bh-period-select] > a');
  const periodSelect = await TU.locator('[data-bh-period-select] > a');
  return periodSelect.click();
}

/**
 * Select a specific period
 * @param {string} periodName - desired period
 * @returns {Promise} for clicking on the desired period
 */
exports.select = async (periodName) => {
  await openSelections();
  const period = await TU.locator(`[data-bh-period-select] a[data-link="${periodName}"]`);
  return period.click();
};

/**
 * Set a custom period with start and end dates
 * @param {string} start - start of the period
 * @param {string} end - end of the period
 * @returns {Promise} for setting the period
 */
exports.custom = async (start, end) => {
  const elm = await TU.locator(periodSelector);
  await openSelections();

  const startFmt = moment(start).format('YYYY-MM-DD');
  const from = elm.locator(by.model('$ctrl.customSelection.from'));
  await from.type(startFmt);

  const endFmt = moment(end).format('YYYY-MM-DD');
  const to = await elm.locator(by.model('$ctrl.customSelection.to'));
  return to.type(endFmt);
};
