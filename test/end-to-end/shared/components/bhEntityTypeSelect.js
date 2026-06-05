const TU = require('../TestUtils');
const { by } = require('../TestUtils');

const selector = '[bh-entity-type-select]';

/**
 * Set the entity type
 * @param {string} type - the id of the entity type to set
 * @param {string} id - the ID of the desired entity type selection element
 * @returns {Promise} promise for the selection
 */
async function set(type, id) {
  const locator = (id) ? by.id(id) : selector;
  const target = await TU.locator(locator);
  return TU.uiSelect('$ctrl.id', type, target);
}

module.exports = {
  set,
};
