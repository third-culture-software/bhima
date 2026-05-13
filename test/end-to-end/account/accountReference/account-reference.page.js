const TU = require('../../shared/TestUtils');
const { by } = require('../../shared/TestUtils');

/**
 * This class is represents an accountReference page in term of structure and
 * behaviour so it is a accountReference page object
 */

const GridRow = require('../../shared/GridRow');

class AccountReferencePage {
  constructor(grid, createBtn, searchBtn) {
    this.grid = grid;
    this.createBtn = createBtn;
    this.searchBtn = searchBtn;
  }

  /**
   * Emulate an async constructor
   * @returns {AccountReferencePage} a new AccountReferencePage object
   */
  static async new() {
    const gridId = 'account-reference-grid';
    const grid = await TU.locator(by.id(gridId));
    const createBtn = await TU.locator('[data-method="create"]');
    const searchBtn = await TU.locator('[data-method="search"]');
    return new AccountReferencePage(grid, createBtn, searchBtn);
  }

  async count() {
    const gridBody = await TU.locator('.ui-grid-render-container-body');
    const repeaterStr = '(rowRenderIndex, row) in rowContainer.renderedRows track by $index';
    const repeater = await gridBody.locator(by.repeater(repeaterStr));
    const rows = await repeater.all();
    return rows.length;
  }

  async create() {
    return this.createBtn.click();
  }

  async search() {
    return this.searchBtn.click();
  }

  async update(reference) {
    const row = new GridRow(reference);
    await row.dropdown();
    await row.edit();
  }

  async remove(reference) {
    const row = new GridRow(reference);
    await row.dropdown();
    await row.remove();
  }
}

module.exports = AccountReferencePage;
