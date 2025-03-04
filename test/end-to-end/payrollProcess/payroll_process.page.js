const TU = require('../shared/TestUtils');

const grid = require('../shared/GridUtils');
const GridRow = require('../shared/GridRow');

const components = require('../shared/components');

/**
 * This class is represents a Payroll Process Page in term of structure and
 * behaviour so it is a Payroll Process Page object
 */

class PayrollProcessPage {
  constructor() {
    this.gridId = 'multipayroll-grid';
    this.actionLinkColumn = 5;
  }

  /**
   * send back the number of multipayrolls in the grid
   */
  async checkEmployeeCount(number, message) {
    await grid.expectRowCount(this.gridId, number, message);
  }

  async editPayrollRubric(reference) {
    const row = new GridRow(reference);
    await row.dropdown();
    await row.method('config');

    await components.currencyInput.set(120, 'TPR');
    await components.currencyInput.set(150, 'PRI');
    await components.currencyInput.set(100, 'v_cher');
    await components.currencyInput.set(100, 'f_scol');
    await components.currencyInput.set(200, 'AL-FAM');
    await components.currencyInput.set(0, 'AC-SAL');
    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  async errorEditPayrollRubric(reference) {
    const row = new GridRow(reference);
    await row.dropdown();
    await row.method('config').click();

    await TU.buttons.submit();
    await components.notification.hasDanger();
  }
}

module.exports = PayrollProcessPage;
