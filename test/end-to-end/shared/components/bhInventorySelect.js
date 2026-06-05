const TU = require('../TestUtils');
const { by } = require('../TestUtils');

const selector = '[bh-inventory-select]';

module.exports = {

  /**
   * Select an inventory item
   * @param {string} inventory - name of the desired inventory item
   * @param {string} [id] - id of the input field (optional)
   * @returns {Promise} for selecting the desired inventory item
   */
  set : async function set(inventory, id) {
    const locator = (id) ? by.id(id) : by.css(selector);
    const target = await TU.locator(locator);
    await target.click();

    await TU.uiSelect('$ctrl.inventoryUuid', inventory, target);
  },
};
