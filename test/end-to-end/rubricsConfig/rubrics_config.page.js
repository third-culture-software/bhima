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

  async create(rubric) {
    await TU.buttons.create();
    await TU.input('RubricConfigModalCtrl.config.label', rubric.label);
    await TU.modal.submit();
    await notification.hasSuccess();
  }

  async errorOnCreateRubricConfig() {
    await TU.buttons.create();
    await TU.modal.submit();
    await TU.validation.error('RubricConfigModalCtrl.config.label');
    await TU.modal.cancel();
  }

  async update(label, updateRubricConfig) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.edit();

    await TU.input('RubricConfigModalCtrl.config.label', updateRubricConfig.label);

    await TU.modal.submit();
    await notification.hasSuccess();
  }

  async setRubricConfig(label) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.edit();

    await TU.waitForSelector(by.id('social'));

    await TU.locator(by.id('social')).click();
    await TU.locator(by.id('tax')).click();

    await TU.modal.submit();
    await notification.hasSuccess();
  }

  async unsetRubricConfig(label) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.edit();

    await TU.waitForSelector(by.id('all'));
    const checkbox = TU.locator(by.id('all'));

    // double click to set all, then unset
    await checkbox.click();
    await checkbox.click();

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
