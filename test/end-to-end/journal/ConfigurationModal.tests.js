const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const JournalPage = require('./journal.page');
const ConfigModal = require('./ConfigurationModal.page');

/**
 *
 */
function JournalConfigurationModal() {
  const defaultVisibleColumnCount = 9;
  const page = new JournalPage();

  test(`displays ${defaultVisibleColumnCount} visible columns by default`, async () => {
    // tests expect page to be in transaction mode
    await TU.locator('[data-method="grouping"]').click();
    await page.expectColumnCount(defaultVisibleColumnCount);
    await TU.locator('[data-method="grouping"]').click();
    await page.expectColumnCount(defaultVisibleColumnCount);
  });

  test('removes all but the debit and credit columns', async () => {
    // remove grouping from the journal
    await page.openGridConfigurationModal();
    const modal = new ConfigModal();
    await modal.setColumnCheckboxes(['debit_equiv', 'credit_equiv']);
    await modal.submit();

    await page.expectHeaderColumns(['Debit', 'Credit']);
  });

  test('resets the columns to the defaults', async () => {
    await page.openGridConfigurationModal();

    const modal = new ConfigModal();
    await modal.setDefaultColumnCheckboxes();
    await modal.submit();

    await page.expectColumnCount(defaultVisibleColumnCount);
  });

  // @TODO: Implement these tests
  // test('saves the column configuration in with uiGridSaveState');
  // test('clears the column configuration in with uiGridSaveState');
}

module.exports = JournalConfigurationModal;
