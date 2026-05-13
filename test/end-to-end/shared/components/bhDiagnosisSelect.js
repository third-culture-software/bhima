const TU = require('../TestUtils');
const { by } = require('../TestUtils');

const selector = '[bh-diagnosis-select]';

/**
 *
 * @param diagnosis
 * @param id
 */
async function set(diagnosis, id) {
  const locator = (id) ? by.id(id) : selector;
  const target = await TU.locator(locator);

  // Input the diagnosis (possibly partial) to open the dropdown menu
  await TU.input('$ctrl.diagnosis', diagnosis, target);

  // select the matching diagnosis from the dropdown menu
  const dropdown = await target.locator('.dropdown-menu > [role="option"]');
  const option = await dropdown.locator(`//a[starts-with(@title, "${diagnosis}")]`);
  return option.click();
}

/**
 *
 */
function validationError() {
  return TU.validation.error('$ctrl.diagnosis');
}

module.exports = {
  set, validationError,
};
