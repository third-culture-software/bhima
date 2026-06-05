const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const components = require('../shared/components');
const shared = require('./stock.shared.page');

/**
 *
 */
function StockImportTests() {
  const STOCK_CSV_FILE = 'stock-to-import.csv';
  const STOCK_CSV_FILE_NO_CODE_NO_CMM = 'stock-to-import-missing-column.csv';
  const depot = 'Depot Principal';

  // navigate to the page
  test.beforeEach(async () => {
    await TU.navigate('/#!/stock/import');
  });

  test('importing stock from a csv file', async () => {
    await TU.waitForSelector('[data-depot-selection-modal]'); // wait for display
    await shared.setDepot(depot);
    await components.dateEditor.set(new Date());

    await shared.uploadFile(STOCK_CSV_FILE);

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });

  test('importing stock from a csv file which have inventory_code missing', async () => {
    await shared.setDepot(depot);
    await components.dateEditor.set(new Date());

    await shared.uploadFile(STOCK_CSV_FILE_NO_CODE_NO_CMM);

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });
}

module.exports = StockImportTests;
