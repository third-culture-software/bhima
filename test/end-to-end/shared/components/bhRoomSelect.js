const TU = require('../TestUtils');
const { by } = require('../TestUtils');

const selector = '[bh-room-select]';

/**
 *
 * @param room
 * @param id
 */
async function set(room, id) {
  const locator = (id) ? by.id(id) : selector;
  const target = await TU.locator(locator);
  return TU.uiSelect('$ctrl.uuid', room, target);
}

/**
 *
 */
function validationError() {
  return TU.validation.error('$ctrl.uuid');
}

module.exports = {
  set, validationError,
};
