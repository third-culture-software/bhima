const TU = require('../TestUtils');
const { by } = require('../TestUtils');

const selector = '[bh-transaction-type-select]';

module.exports = {

  /**
   * Select a set of transaction types
   * @param {Array} transactionTypes - array of transaction types
   * @param {string} [id] - id of selection field
   * @returns {Promise} for selecting the desired transaction types
   */
  set : async function set(transactionTypes, id) {
    const locator = (id) ? by.id(id) : by.css(selector);
    const tsel = await TU.locator(locator);
    await tsel.click();

    return TU.series(transactionTypes, type => TU.uiSelect('$ctrl.selectedTransactionTypes', type));
  },
};
