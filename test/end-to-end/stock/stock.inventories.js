const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const GU = require('../shared/GridUtils');
const SearchModal = require('../shared/search.page');
const Filters = require('../shared/components/bhFilters');

/**
 *
 */
function StockInventoriesRegistryTests() {
  const path = '/#!/stock/inventories';
  let modal;
  let filters;

  // navigate to the page
  test.beforeEach(async () => {
    await TU.navigate(path);
    modal = new SearchModal('stock-inventories-search', path);
    await modal.open();
    filters = new Filters();
  });

  test.afterEach(async () => {
    await filters.resetFilters();
  });

  const gridId = 'stock-inventory-grid';

  const depotGroupingRow = 1;

  test('find 2 (or 0) inventory in Depot Tertiaire plus one line for the Grouping', async () => {
    await modal.setDepot('Depot Tertiaire');
    await TU.modal.submit();

    await GU.expectRowCount(gridId, [2 + depotGroupingRow, 0]);
  });

  test('find 3 (or 4) inventory in Depot Principal plus one line for the Grouping', async () => {
    await modal.setDepot('Depot Principal');
    await modal.submit();

    await GU.expectRowCount(gridId, [3 + depotGroupingRow, 4 + depotGroupingRow]);
  });

  test('find inventory by name', async () => {
    await modal.setInventory('DORA_QUIN1S-_0'); // Quinine Bichlorhydrate, sirop, 100mg base/5ml, 100ml, flacon, Unité
    await modal.setDepot('Depot Principal');
    await modal.submit();

    await GU.expectRowCount(gridId, 2);
  });

  test('find 0 inventory by state stock out', async () => {
    await TU.radio('$ctrl.searchQueries.status', 0);
    await TU.modal.submit();

    await GU.expectRowCount(gridId, 0);
  });

  test('find 0 inventory by state in stock', async () => {
    await TU.radio('$ctrl.searchQueries.status', 1);
    await TU.modal.submit();
    await GU.expectRowCount(gridId, 0);

    await filters.resetFilters();
  });

  test('find 0 inventory by state (security reached)', async () => {
    await TU.radio('$ctrl.searchQueries.status', 2);
    await TU.modal.submit();

    await GU.expectRowCount(gridId, 0);
  });

  test('find 0 inventories by state for grouping (minimum reached)', async () => {
    await TU.radio('$ctrl.searchQueries.status', 3);
    await TU.modal.submit();

    await GU.expectRowCount(gridId, 0);
  });

  test('find 0 (or 3) inventories by state (over maximum)', async () => {
    await TU.radio('$ctrl.searchQueries.status', 4);
    await TU.modal.submit();

    await GU.expectRowCount(gridId, [0, 3]);
  });

  test('find 7 (or 8) inventories for all time ', async () => {
    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('allTime');
    await modal.submit();

    await GU.expectRowCount(gridId, [7, 8]);
  });

  test('find 0 inventories who requires a purchase order plus one line of grouping', async () => {
    await TU.locator(by.model('$ctrl.searchQueries.require_po')).click();
    await TU.modal.submit();
    await GU.expectRowCount(gridId, 0);
    await filters.resetFilters();
  });

}

module.exports = StockInventoriesRegistryTests;
