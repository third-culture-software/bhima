const TU = require('../TestUtils');
const { by } = require('../TestUtils');

const selector = '[data-bh-date-interval]';

module.exports = {

  /**
   * sets the value of the date start
   * @param {string} value - date value to enter
   * @param {string} [id] - ID of date field (optional)
   * @returns {Promise} of typing into the date field
   */
  dateFrom : async function dateFrom(value, id) {
    const ctx = (id)
      ? await TU.locator(`[date-id="${id}"]`)
      : await TU.locator(selector);
    const elt = ctx.locator(by.model('$ctrl.dateFrom'));
    await elt.clear();
    return elt.type(value);
  },

  /**
   * sets the value of the date stop
   * @param {string} value - date value to enter
   * @param {string} [id] - ID of date field (optional)
   * @returns {Promise} of typing into the date field
   */
  dateTo : async function dateTo(value, id) {
    const ctx = (id)
      ? await TU.locator(`[date-id="${id}"]`)
      : await TU.locator(selector);
    const elt = ctx.locator(by.model('$ctrl.dateTo'));
    await elt.clear();
    return elt.type(value);
  },

  /**
   * sets the start and stop values into a date field
   * @param {string} start - start date value to enter
   * @param {string} end - end date value to enter
   * @param {string} [id] - ID of date field (optional)
   * @returns {Promise} of entering the start and stop dates
   */
  range : async function range(start, end, id) {
    await this.dateFrom(start, id);
    return this.dateTo(end, id);
  },
};
