const TU = require('../TestUtils');
const { by } = require('../TestUtils');

module.exports = {

  selector : '[data-bh-checkbox-tree]',

  /**
   * Toggle the row selector
   * @param {string} labels - label to toggle
   * @param {string} id - selector
   */
  async toggle(labels, id) {
    const locator = (id) ? by.id(id) : this.selector;
    const tree = await TU.locator(locator);
    return TU.series(labels, async (label) => tree.locator(`[data-label="${label}"]`).click());
  },

  /**
   * Toggle the 'check' state of all checkbox in a set
   * using the "Check All" button
   * @param {string} id - id of checkbox set
   * @returns {Promise} of all items being toggled
   */
  async toggleAllCheckboxes(id) {
    const locator = (id) ? by.id(id) : this.selector;
    return TU.locator(`${locator} [data-root-node]`).click();
  },

  /**
   * See if a checkbox is checked
   * @param {string} id - id of checkbox to check
   * @returns {Promise} of whether the checkbox is checked
   */
  async isChecked(id) {
    const locator = (id) ? by.id(id) : this.selector;
    const tree = await TU.locator(`${locator} [data-root-node] input`);
    return tree.isChecked();
  },

};
