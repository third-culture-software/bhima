const TU = require('../TestUtils');
const { by } = require('../TestUtils');

/**
 * test harness for the currency select component described in the component
 * bhCurrencySelect.js.
 */

const selector = '[data-bh-currency-select]';

module.exports = {

  /**
   * Sets the value of the currency select.
   * @param {string} value - The desired currency name to set
   * @param {string} [id] - id for locator (optional)
   * @returns {Promise} of selectiing the desired currency
   * @todo - make value == ('FC' || 'USD') instead of an id.
   */
  set : async function set(value, id) {

    // get the root value of the
    const root = await TU.locator(id ? by.id(id) : selector);

    // construct a locator for the value
    const locator = `[data-currency-option="${value}"]`;

    // get the appropriate option by the locator
    const option = await root.locator(locator);

    // click it!
    return option.click();
  },
};
