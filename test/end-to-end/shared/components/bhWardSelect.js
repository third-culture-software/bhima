const { expect } = require('@playwright/test');
const TU = require('../TestUtils');
const { by } = require('../TestUtils');

const selector = '[bh-ward-select]';

/**
 *
 * @param ward
 * @param id
 */
async function set(ward, id) {
  const locator = (id) ? by.id(id) : selector;
  const target = await TU.locator(locator);
  return TU.uiSelect('$ctrl.uuid', ward, target);
}

/**
 *
 */
async function validationError() {
  const modelElt = await TU.locator(by.name('ward_uuid'));
  const eltClass = await modelElt.getAttribute('class');
  expect(eltClass.includes('ng-invalid'),
    `Expected ward selection to be invalid, but could not find the ng-invalid class.`);
}

module.exports = {
  set, validationError,
};
