const TU = require('../TestUtils');
const { by } = require('../TestUtils');

/**
 * set the depot
 * @param {string} depot - name of selected depot
 * @param {id} id - CSS id for anchor containing the depot select field (defaults to 'body') (optional)
 * @param {string} parentName - css/name of parent element (optional)
 * @returns {Promise} of the typing into the selection field
 */
async function set(depot, id, parentName) {
  const parent = parentName || 'body';
  const anchor = (id) ? await TU.locator(by.id(id)) : await TU.locator(parent);
  const elt = await anchor.locator(by.model('$ctrl.depotText'));
  await elt.clear();
  await elt.type(depot);
  return elt.press('Enter');
}

module.exports = {
  selector : '[bh-depot-select]',
  set,
};
