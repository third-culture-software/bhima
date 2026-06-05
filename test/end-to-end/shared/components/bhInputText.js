const { expect } = require('@playwright/test');
const TU = require('../TestUtils');
const { by } = require('../TestUtils');

module.exports = {

  // root level css selector for this component
  selector : '[input-text]',

  getInput : async (id) => {
    if (id) {
      return TU.locator(by.id(id));
    }
    const root = await TU.locator(this.selector);
    if (root) {
      return root;
    }
    const root2 = await TU.locator('[input-text-field]');
    return root2;
  },

  /**
   * Sets the input's value by it id
   * @param {string} id - a CSS id to select on.
   * @param {string} value - the text value
   */
  set : async function set(id, value) {
    const input = await this.getInput(id);
    await input.clear();
    // Convert numbers to string due to Playwright limitations
    await input.fill(typeof value === 'number' ? value.toString() : value); // set the input value
  },

  validationError : async function validationError(id) {
    const field = await this.getInput(id);
    const classes = await field.getAttribute('class');
    expect(classes.includes('ng-invalid'),
      `Expected ${id} to be invalid, but could not find the ng-invalid class.`);
  },

  validationOk : async function validationOk(id) {
    const field = await this.getInput(id);
    const classes = await field.getAttribute('class');
    expect(classes.includes('ng-valid'),
      `Expected ${id} to be invalid, but could not find the ng-invalid class.`);
  },
};
