const TU = require('../shared/TestUtils');

class JournalConfigurationModal {
  constructor() {
    this.buttons = {
      reset : TU.buttons.reset,
      submit : TU.modal.submit,
    };
  }

  // toggle the column checkboxes to the following values
  // NOTE - these values come from the database column names, not the i18n text name
  async setColumnCheckboxes(array) {
    const modal = await TU.locator('[uib-modal-window]');
    const inputsObject = await modal.locator('.modal-body').locator('input[type="checkbox"]');
    const inputs = await inputsObject.all();

    // deselect inputs that are selected and shouldn't be
    const needClearing = [];
    for (const cb of inputs) {  
      const checked = await cb.isChecked();  
      const field = await cb.getAttribute('data-column');  
      if (checked && array.includes(field)) {
        needClearing.push(cb);
      }
    }
    await Promise.all(needClearing.map(cb => cb.check()));

    // select inputs that are not selected and should be
    const needSetting = [];
    for (const cb of inputs) {  
      const checked = await cb.isChecked();  
      const field = await cb.getAttribute('data-column');  
      if (!checked && array.includes(field)) {
        needSetting.push(cb);
      }
    }
    return Promise.all(needSetting.map(cb => cb.check()));
  }

  // reset the default column selection
  setDefaultColumnCheckboxes() {
    return this.buttons.reset();
  }

  submit() {
    return this.buttons.submit();
  }
}
module.exports = JournalConfigurationModal;
