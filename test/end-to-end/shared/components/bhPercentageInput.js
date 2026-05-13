const TU = require('../TestUtils');
const { by } = require('../TestUtils');

const selector = '[data-bh-percentage-input]';

/**
 * hooks for the percentage input component described in the component
 * bhPercentageInput.js.
 * @public
 */
module.exports = {

  /**
   * sets the value of the percentage input.
   * @param value
   * @param id
   */
  set : function set(value, id) {
    const root = TU.locator(id ? by.id(id) : selector);
    const elm = root.locator(by.model('$ctrl.model'));
    return TU.fill(elm, value);
  },

  /**
   * get the value of the percentage input.
   */
  get : function get() {
    const elm = TU.locator(selector);
    return elm.getAttribute('value');
  },
};
