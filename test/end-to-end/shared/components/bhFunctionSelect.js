const TU = require('../TestUtils');
const { by } = require('../TestUtils');

const selector = '[bh-fonction-select]';

module.exports = {

  /**
   * Select a function
   * @param {string} func - the desired function name
   * @param {string} id - for the input field (optional)
   * @returns {Promise} for selecting the function
   */
  set : async function set(func, id) {
    const locator = (id) ? by.id(id) : selector;
    const target = await TU.locator(locator);

    await target.click();

    return TU.uiSelect('$ctrl.fonctionId', func, target);
  },
};
