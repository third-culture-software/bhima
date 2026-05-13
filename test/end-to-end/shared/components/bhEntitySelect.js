const TU = require('../TestUtils');
const { by } = require('../TestUtils');

const selector = '[bh-entity-select]';

/**
 * Set the entity
 * @param {string} entity - the uuid of the entity to set
 * @param {string} id - the ID of the desired entity selection element
 * @returns {Promise} promise for the selection
 */
async function set(entity, id) {
  const locator = (id) ? by.id(id) : selector;
  const target = await TU.locator(locator);
  return TU.uiSelect('$ctrl.entityUuid', entity, target);
}

module.exports = {
  set,
};
