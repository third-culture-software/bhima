const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const GridRow = require('../shared/GridRow');
const { notification } = require('../shared/components');

class RubricConfigPage {
  constructor() {
    this.gridId = 'rubric-grid';
  }

  async count() {
    const rows = await TU.locator(by.id(this.gridId))
      .locator('.ui-grid-render-container-body')
      .locator(by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows track by $index'));
    return rows.count();
  }

  async create(rubric, checklist = []) {
    await TU.buttons.create();
    await TU.input('RubricConfigModalCtrl.config.label', rubric.label);

    // loop through rubric ids in checklist and check them
    await Promise.all(checklist.map(async (item) => TU.locator(by.id(item)).click()));

    await TU.modal.submit();
    await notification.hasSuccess();
  }

  async errorOnCreateRubricConfig() {
    await TU.buttons.create();
    await TU.modal.submit();
    await TU.validation.error('RubricConfigModalCtrl.config.label');
    await TU.modal.cancel();
  }

  async update(label, updateRubricConfig, checklist = []) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.edit();

    await TU.input('RubricConfigModalCtrl.config.label', updateRubricConfig.label);

    // reset the updated checkboxes
    await TU.waitForSelector(by.id('all'));
    const checkbox = TU.locator(by.id('all'));

    // double click to set all, then unset
    await checkbox.click();
    await checkbox.click();

    // now update the values
    await Promise.all(checklist.map(async (item) => TU.locator(by.id(item)).click()));

    await TU.modal.submit();
    await notification.hasSuccess();
  }

  async remove(label) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.remove();
    await TU.modal.submit();
    await notification.hasSuccess();
  }
}

module.exports = RubricConfigPage;
