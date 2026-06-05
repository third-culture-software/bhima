const TU = require('../TestUtils');
const { by } = require('../TestUtils');

/**
 * hooks for the currency input component described in the component
 * bhCurrencyInput.js.
 */

const selector = '[data-bh-currency-input]';

module.exports = {

  /**
   * sets the value of the currency input
   * @param {string} value - The desired currency name to set
   * @param {string} [id] - id for locator (optional)
   * @returns {Promise} of entering the desired currency
   */
  set : async function set(value, id) {
    const root = await TU.locator(id ? by.id(id) : selector);
    const elm = await root.locator(by.model('$ctrl.model'));

    // Playwright is having problems with input fields with type=number
    return elm.type(typeof value === 'number' ? value.toString() : value);
  },

  /**
   * get the value of the currency input
   * @returns {Promise} for the value of the currency field
   */
  get : async function get() {
    const elm = await TU.locator(selector);
    return elm.getAttribute('value');
  },
};
