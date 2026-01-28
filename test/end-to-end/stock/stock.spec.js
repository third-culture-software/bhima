const { chromium } = require('@playwright/test');
const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

const StockExitTests = require('./stock.exit');
// const StockAssignTests = require('./stock.assign');
const StockEntryTests = require('./stock.entry');
const StockInventoriesRegistryTests = require('./stock.inventories');
const StockLotsRegistryTests = require('./stock.lots');
const StockMovementsRegistryTests = require('./stock.movements');
const StockRequisitionTests = require('./stock.requisition');
const StockInventoryAdjustement = require('./stock.z1.inventory-adjustment');
const StockSetting = require('./stock.setting');
const StockImportTests = require('./stock.import');

test.describe('Stock E2E', () => {
  test.describe('Stock Import', StockImportTests);
  // ??? test.describe('Stock Assign', StockAssignTests);
  test.describe('Stock Entry', StockEntryTests);
  test.describe('Stock Exit', StockExitTests);
  test.describe('Stock Inventory Registry', StockInventoriesRegistryTests);
  test.describe('Stock Lots Registry', StockLotsRegistryTests);
  test.describe('Stock Movement Registry', StockMovementsRegistryTests);
  test.describe('Stock Requisition Module', StockRequisitionTests);
  test.describe('Stock Inventory Adjustment', StockInventoryAdjustement);
  test.describe('Stock Setting', StockSetting);
});
