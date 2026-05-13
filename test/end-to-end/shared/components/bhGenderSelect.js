const TU = require('../TestUtils');
const { by } = require('../TestUtils');

const selector = '[bh-gender-select]';

/**
 * Set the gender
 * @param {string} gender - the gender to set
 * @param {string} id - the ID of the desired gender selection element
 * @returns {Promise} promise for the selection
 */
async function set(gender, id) {
  const locator = (id) ? by.id(id) : selector;
  const target = await TU.locator(locator);
  return TU.select('$ctrl.value', { label : gender }, target);
}

module.exports = {
  set,
};
