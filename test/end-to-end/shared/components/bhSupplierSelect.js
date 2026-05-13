const TU = require('../TestUtils');
const { by } = require('../TestUtils');

const selector = '[bh-supplier-select]';

module.exports = {

  /**
   * Select a supplier
   * @param {string} supplier - name of desired supplier
   * @param {string} [id] - id of input field (optional)
   * @returns {Promise} for selecting the supplier
   */
  set : async function set(supplier, id) {
    const locator = (id) ? by.id(id) : by.css(selector);
    const target = await TU.locator(locator);
    await target.click();
    return TU.uiSelect('$ctrl.supplierUuid', supplier, target);
  },
};
