const TU = require('../shared/TestUtils');

const GA = require('../shared/GridAction');
const GU = require('../shared/GridUtils');

const components = require('../shared/components');

/**
 * This class is represents a payroll configuration page in term of structure and
 * behaviour so it is a payroll configuration page object
 */

class PayrollConfigPage {
  constructor() {
    this.gridId = 'payroll-configuration-grid';
    this.actionLinkColumn = 3;
  }

  /**
   * simulate the create PayrollConfig button click to show the dialog of creation
   * @param payrollConfig
   */
  async createPayrollConfig(payrollConfig) {
    await TU.buttons.create();
    await TU.input('PayrollConfigModalCtrl.payroll.label', payrollConfig.label);
    if (payrollConfig.period) {
      await TU.locator(`[data-date-range="${payrollConfig.period}"]`).click();
    }

    await components.rubricConfigSelect.set(payrollConfig.config_rubric_id, 'config_rubric_id');
    await components.accountConfigSelect.set(payrollConfig.config_accounting_id, 'config_accounting_id');
    await components.weekConfigSelect.set(payrollConfig.config_weekend_id, 'config_weekend_id');
    await components.iprConfigSelect.set(payrollConfig.config_ipr_id, 'config_ipr_id');
    await components.employeeConfigSelect.set(payrollConfig.config_employee_id, 'config_employee_id');

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * block creation without the function name
   */
  async errorOnCreatePayrollConfig() {
    await TU.buttons.create();
    await TU.buttons.submit();
    await TU.validation.error('PayrollConfigModalCtrl.payroll.label');
    await TU.buttons.cancel();
  }

  /**
   * simulate a click on the edit link of a function
   * @param label
   * @param updatePayrollConfig
   */
  async editPayrollConfig(label, updatePayrollConfig) {
    const { rowIndex } = await GU.getGridIndexesMatchingText(this.gridId, label);
    await GA.clickOnMethod(rowIndex, this.actionLinkColumn, 'edit', this.gridId);
    await TU.input('PayrollConfigModalCtrl.payroll.label', updatePayrollConfig.label);

    if (updatePayrollConfig.period) {
      await TU.locator(`[data-date-range="${updatePayrollConfig.period}"]`).click();
    }

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * simulate a click on the delete link of a function
   * @param label
   */
  async deletePayrollConfig(label) {
    const { rowIndex } = await GU.getGridIndexesMatchingText(this.gridId, label);
    await GA.clickOnMethod(rowIndex, this.actionLinkColumn, 'delete', this.gridId);
    await components.modalAction.confirm();
    await components.notification.hasSuccess();
  }
}

module.exports = PayrollConfigPage;
