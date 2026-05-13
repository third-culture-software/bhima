const TU = require('../shared/TestUtils');
const GridRow = require('../shared/GridRow');
const components = require('../shared/components');

class EmployeeConfigPage {
  constructor() {
    this.gridId = 'employee-config-grid';
  }

  /**
   * Create a new employee configuration
   * @param {object} config- info for the new employee config
   * @param config
   */
  async create(config) {
    await TU.buttons.create();

    await TU.input('EmployeeModalCtrl.configuration.label', config.label);

    await TU.modal.submit();
    await components.notification.hasSuccess();
  }

  /**
   * Create an error by trying to create an employee config with no info
   */
  async errorOnCreateEmployeeConfig() {
    await TU.buttons.create();
    await TU.modal.submit();
    await TU.validation.error('EmployeeModalCtrl.configuration.label');
    await TU.modal.cancel();
  }

  /**
   * Update and employee configuration
   * @param {string} label - label for the employee to update
   * @param {object} updateEmployeeConfig - info to update
   */
  async update(label, updateEmployeeConfig) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.edit();

    await TU.input('EmployeeModalCtrl.configuration.label', updateEmployeeConfig.label);

    await TU.modal.submit();
    await components.notification.hasSuccess();
  }

  /**
   * Set all options in the employee configuration
   * @param {string} label - label for the employee config to update
   */
  async setEmployeeConfig(label) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.method('edit-record');
    await TU.waitForSelector('div.modal-body');

    await components.bhCheckboxTree.toggleAllCheckboxes();
    await TU.modal.submit();
    await components.notification.hasSuccess();
  }

  /**
   * Edit an employee configuration and unset all options
   * @param {string} label - label of the employee config to edit
   */
  async unsetEmployeeConfig(label) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.method('edit');

    const isAllChecked = await components.bhCheckboxTree.isChecked();

    if (!isAllChecked) {
      // First click for select all
      await components.bhCheckboxTree.toggleAllCheckboxes();
    }

    // Second click for unselect all
    await components.bhCheckboxTree.toggleAllCheckboxes();
    await TU.modal.submit();

    await components.notification.hasSuccess();
  }

  /**
   * Delete an employee configuration
   * @param {string} label - label of the employee config to remove
   */
  async remove(label) {
    const row = new GridRow(label);
    await row.dropdown();
    await row.remove();
    await TU.waitForSelector('form[name="ConfirmModalForm"]');

    await components.modalAction.confirm();
    await components.notification.hasSuccess();
  }
}

module.exports = EmployeeConfigPage;
