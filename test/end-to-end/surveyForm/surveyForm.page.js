const { expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const GridRow = require('../shared/GridRow');
const components = require('../shared/components');

/**
 * This class is represents a Survey Form page in term of structure and
 * behaviour so it is a Survey Form Management page object
 */
class SurveyFormManagementPage {

  /**
   * simulate the create Survey Form button click to show the dialog of creation
   * @param SurveyForm
   */
  async create(SurveyForm) {
    await components.dataCollector.set(SurveyForm.dataCollector);
    await TU.buttons.create();

    await components.surveyFormTypeSelect.set(SurveyForm.type);
    await TU.input('SurveyFormModalCtrl.surveyForm.name', SurveyForm.name);
    await TU.input('SurveyFormModalCtrl.surveyForm.label', SurveyForm.label);
    await TU.input('SurveyFormModalCtrl.surveyForm.hint', SurveyForm.hint);
    await TU.locator(by.id('is_required')).click();

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * Verify the validation of the parameter name for several scenarios
   * @param SurveyForm
   * @param surveyFormName
   */
  async checkValidate(SurveyForm, surveyFormName) {
    await components.dataCollector.set(SurveyForm.dataCollector);
    await TU.buttons.create();

    await components.surveyFormTypeSelect.set(SurveyForm.type);
    await TU.input('SurveyFormModalCtrl.surveyForm.name', surveyFormName);
    await TU.input('SurveyFormModalCtrl.surveyForm.label', SurveyForm.label);
    await TU.input('SurveyFormModalCtrl.surveyForm.hint', SurveyForm.hint);
    await TU.waitForSelector(by.id('is_required'));
    await TU.locator(by.id('is_required')).check();

    // Verify the submit button is disabled because of the error
    const submitBtn = await TU.locator('[data-method="submit"]');
    expect(await submitBtn.isEnabled()).toBe(false);

    // await TU.buttons.submit();
    // await TU.waitForSelector(by.id('error_format'));
    // await TU.exists(by.id('error_format'), true);
    await TU.modal.cancel();
  }

  /**
   * simulate the create Survey Form button click to show the dialog of creation
   */

  async createDeletable(SurveyForm) {
    await TU.buttons.create();
    await components.surveyFormTypeSelect.set(SurveyForm.type);
    await components.choiceListSelect.set(SurveyForm.choice_list_id);
    await components.surveyListSelect.set(SurveyForm.filter_choice_list_id);
    await TU.input('SurveyFormModalCtrl.surveyForm.name', SurveyForm.name);
    await TU.input('SurveyFormModalCtrl.surveyForm.label', SurveyForm.label);
    await TU.waitForSelector(by.id('is_required'));
    await TU.locator(by.id('is_required')).check();
    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * simulate a click on the edit link of a function
   * @param label
   * @param updateSurveyForm
   */
  async edit(label, updateSurveyForm) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.edit();
    await components.surveyFormTypeSelect.set(updateSurveyForm.type);
    await components.choiceListSelect.set(updateSurveyForm.choice_list_id);
    await TU.input('SurveyFormModalCtrl.surveyForm.name', updateSurveyForm.name);
    await TU.input('SurveyFormModalCtrl.surveyForm.label', updateSurveyForm.label);
    await TU.input('SurveyFormModalCtrl.surveyForm.hint', updateSurveyForm.hint);
    await TU.waitForSelector(by.id('is_required'));
    await TU.locator(by.id('is_required')).check();
    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * simulate a click on the delete link of a function
   * @param label
   */
  async delete(label) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.remove();

    await TU.modal.submit();
    await components.notification.hasSuccess();
  }
}

module.exports = SurveyFormManagementPage;
