const { chromium, test } = require('@playwright/test');

const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');
const GU = require('../shared/GridUtils');

const components = require('../shared/components');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('Edit Posting Journal', () => {
  const path = '/#!/journal';
  const gridId = 'journal-grid';
  const editingGridId = 'transaction-edit-grid';

  /**
   * Open the editing model for the selected row
   * (Select a row first)
   */
  async function openEditingModal() {
    await TU.buttons.edit();
    await TU.waitForSelector(by.id(editingGridId));
  }

  test.beforeEach(async () => {
    await TU.navigate(path);
  });

  test('edits a transaction to change an account', async () => {
    await GU.clearRowSelections(gridId);
    await GU.selectRow(gridId, 0);
    await TU.waitForSelector('button#editTransaction:not([disabled])');
    await openEditingModal();

    const accountNumberCell = await GU.getCell(editingGridId, 0, 1);
    await accountNumberCell.dblclick();
    await TU.input('accountInputValue', '11110000', accountNumberCell);
    const acts = await TU.locator('.uib-typeahead-match a').first();
    await acts.click();

    await TU.modal.submit();
    await components.notification.hasSuccess();
  });

  /**
  * Edits a numeric input cell in a grid by double-clicking to open the cell's editing pane
  * and inputting a specified value.
  *
  * @param {number} rowIndex - The zero-based index of the row to edit in the grid.
  * @param {number} columnIndex - The zero-based index of the column to edit in the grid.
  * @param {number} value - The numeric value to enter into the cell.
  *
  * @returns {Promise<void>} A promise that resolves when the cell editing is complete.
  *
  * @example
  * // Edit the value in the second row, third column to 42
  * await editInput(1, 2, 42);
  */
  async function editInput(rowIndex, columnIndex, value) {
    const cell = await GU.getCell(editingGridId, rowIndex, columnIndex);

    // open the editing pane
    await cell.dblclick();

    // get the element
    const input = await TU.locator('input[type=number]');
    await input.press('Control+A');
    await TU.fill(input, value);
    return input.press('Enter');
  }

  test('edits a transaction to change the value of debit and credit', async () => {
    await GU.clearRowSelections(gridId);

    // FIXME(jniles) - I select the eleventh row (index - 11) to make
    // this test pass.  Ideally, we should filter the PJ on a specific transaction ID to make
    // sure we always edit the correct transaction.
    await GU.selectRow(gridId, 10);
    await TU.waitForSelector('button#editTransaction:not([disabled])');
    await openEditingModal();

    await editInput(0, 2, 99);
    await editInput(0, 3, 0);

    await editInput(1, 2, 0);
    await editInput(1, 3, 99);

    await TU.modal.submit();
    await TU.exists(by.id('validation-errored-alert'), false);
    await components.notification.hasSuccess();
  });

  test('prevents an unbalanced transaction', async () => {
    await GU.clearRowSelections(gridId);
    await GU.selectRow(gridId, 0);
    await TU.waitForSelector('button#editTransaction:not([disabled])');
    await openEditingModal();

    await editInput(0, 2, 100);
    await editInput(0, 3, 0);

    await editInput(1, 2, 0);
    await editInput(1, 3, 50);

    await TU.modal.submit();

    await TU.exists(by.id('validation-errored-alert'), true);

    await TU.modal.cancel();
  });

  // Test for validation
  test('prevents a single line transaction', async () => {
    await GU.clearRowSelections(gridId);
    await GU.selectRow(gridId, 0);
    await TU.waitForSelector('button#editTransaction:not([disabled])');
    await openEditingModal();

    await GU.selectRow(editingGridId, 0);
    const delRowBtn = await TU.locator('button[ng-click="ModalCtrl.removeRows()"]');
    await delRowBtn.click();
    await TU.modal.submit();

    await TU.exists(by.id('validation-errored-alert'), true);
    await TU.modal.cancel();
  });

  // @TODO: Fix.  Works alone but fails with other tests
  test.skip('preventing transaction who have debit and credit null', async () => {
    await GU.clearRowSelections(gridId);
    await GU.selectRow(gridId, 0);
    await TU.waitForSelector('button#editTransaction:not([disabled])');
    await openEditingModal();

    await editInput(0, 2, 0);
    await editInput(0, 3, 0);

    await editInput(1, 2, 0);
    await editInput(1, 3, 0);

    await TU.modal.submit();
    await TU.exists(by.id('validation-errored-alert'), true);
    await TU.modal.cancel();
  });

  test('preventing transaction who was debited and credited in a same line', async () => {
    await GU.clearRowSelections(gridId);
    await GU.selectRow(gridId, 0);
    await TU.waitForSelector('button#editTransaction:not([disabled])');
    await openEditingModal();

    await editInput(0, 2, 10);
    await editInput(0, 3, 10);

    await editInput(1, 2, 10);
    await editInput(1, 3, 0);

    await TU.modal.submit();
    await TU.exists(by.id('validation-errored-alert'), true);
    await TU.modal.cancel();
  });
});
