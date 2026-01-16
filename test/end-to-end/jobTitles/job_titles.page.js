const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const GridRow = require('../shared/GridRow');

class JobTitlePage {
  async create(label) {
    await TU.buttons.create();
    await TU.input('TitleModalCtrl.title.title_txt', label);
    await TU.buttons.submit();
  }

  async errorOnCreateFunction() {
    await TU.buttons.create();
    await TU.buttons.submit();
    await TU.validation.error('TitleModalCtrl.title.title_txt');
    await TU.buttons.cancel();
  }

  async update(oldLabel, newLabel) {
    const row = new GridRow(oldLabel);
    await row.dropdown();
    await row.edit();
    await TU.input('TitleModalCtrl.title.title_txt', newLabel);

    await TU.waitForSelector(by.name('is_medical'));
    const checkbox = TU.locator(by.name('is_medical'));
    await checkbox.click();

    await TU.buttons.submit();
  }

  async remove(label) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.remove();
    await TU.modal.submit();
  }
}

module.exports = JobTitlePage;
