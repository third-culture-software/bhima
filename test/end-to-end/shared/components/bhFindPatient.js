const TU = require('../TestUtils');
const { by } = require('../TestUtils');

// const selector = '[data-find-patient]';

module.exports = {

  /**
   * sets the input to the correct mode
   * @param {string} _mode - the desired mode ('id', 'name')
   * @returns {Promise} for selecting the mode
   */
  mode : async function mode(_mode) {
    // See if we need to reset the form
    await TU.waitForSelector('bh-find-patient');
    const reset = await TU.locator('bh-find-patient a:has(i.fa-refresh)').count();
    if (reset) {
      await this.reset();
    }

    // Open the dropdown
    await TU.waitForSelector('[data-find-patient-dropdown-toggle]');
    const dropdown = await TU.locator('[data-find-patient-dropdown-toggle]');
    await dropdown.click();

    // are we searching by id or name?
    const tmpl = (_mode === 'id') ? 'ID' : 'NAME';

    // click the correct dropdown item
    const option = await TU.locator(`[data-find-patient-option="FORM.LABELS.PATIENT_${tmpl}"]`);
    return option.click();
  },

  /**
   * searches for a patient by name
   * @param {string} name - name of the patient to find
   * @returns {Promise} for searching for the name
   * @todo - this needs to be improved to select directly from the typeahead
   */
  findByName : async function findByName(name) {
    // set the input to "find by name" mode
    await this.mode('name');

    // get the input and enter the name provided
    const field = await TU.locator(by.model('$ctrl.nameInput'));
    await field.type(name);
    return field.press('Enter');
  },

  /**
   * searches for a patient by id
   * @param {string} id - the patient id
   * @returns {Promise} for searching for the patient by ID
   */
  findById : async function findById(id) {

    // set the input to "find by name" mode
    await this.mode('id');

    // get the input and enter the id provided
    await TU.input('$ctrl.idInput', id);

    // @TODO: Fix this so findByName and findById work similarly
    //        and adjust users of these functions

    // submit the id to the server
    const submit = await TU.locator('[data-find-patient-submit]');
    return submit.click();
  },

  /**
   * Reset the form
   * @returns {Promise} for resetting the form
   */
  reset : async function reset() {
    const resetBtn = await TU.locator('bh-find-patient a:has(i.fa-refresh)');
    return resetBtn.click();
  },
};
