const moment = require('moment');

const TU = require('../TestUtils');
const { by } = require('../TestUtils');

/**
 * hooks for the Date Picker component described in the component
 * bhDatePicker.js
 */

module.exports = {
  /**
   * @param {Date} dateString - date string (YYYY-MM-DD). Ex. 2017-04-17
   * @param {object} anchor - An element as parent
   */
  async set(dateString, anchor) {
    const root = anchor || TU.locator('body');
    const date = moment(dateString).format('DD/MM/YYYY');
    const dateField = root.locator(by.model('$ctrl.date'));
    return TU.fill(dateField, date);
  },
};
