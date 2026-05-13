const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const GU = require('../shared/GridUtils');

const SearchModal = require('../shared/search.page');
const Filters = require('../shared/components/bhFilters');

/**
 *
 */
function StockMovementsRegistryTests() {
  const path = '/#!/stock/movements';
  let modal;
  let filters;

  // navigate to the page
  test.beforeEach(async () => {
    await TU.navigate(path);
    modal = new SearchModal('stock-movements-search', path);
    await modal.open();
    filters = new Filters();
  });

  test.afterEach(async () => {
    await filters.resetFilters();
  });

  const gridId = 'stock-movements-grid';
  const depotGroupingRow = 1;

  const REFERENCE = 'SM.9.5';

  test('finds movements for all time', async () => {
    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('allTime');
    await modal.submit();
    await GU.expectRowCount(gridId, [12 + (2 * depotGroupingRow), 21 + (2 * depotGroupingRow)]);
  });

  test('find entry movements ', async () => {
    await modal.setEntryExit(0);
    await modal.switchToDefaultFilterTab();
    await modal.submit();
    await GU.expectRowCount(gridId, [5 + (2 * depotGroupingRow), 3 + (2 * depotGroupingRow)]);
  });

  test('filters by exit', async () => {
    await modal.setEntryExit(1);
    await modal.switchToDefaultFilterTab();
    await modal.submit();
    await GU.expectRowCount(gridId, [7 + depotGroupingRow, 6 + depotGroupingRow]);
  });

  test('find movements by depot secondaire', async () => {
    await modal.setDepot('Depot Secondaire');
    await modal.submit();
    await GU.expectRowCount(gridId, [0, 2 + depotGroupingRow]);
  });

  test('find movements by depot tertiaire', async () => {
    await modal.setDepot('Depot Tertiaire');
    await modal.submit();
    await GU.expectRowCount(gridId, [2 + depotGroupingRow, 0]);
  });

  test('find movements by Service', async () => {
    await modal.setDepot('Depot Principal');
    await modal.setServiceUuid('Administration');
    await modal.submit();
    await GU.expectRowCount(gridId, [1 + depotGroupingRow, 0]);
  });

  test('find movements by inventory', async () => {
    await modal.setInventory('DORA_QUIN1S-_0');
    await modal.submit();
    await GU.expectRowCount(gridId, [4 + depotGroupingRow, 7 + depotGroupingRow]);
  });

  test('find movements by lot name', async () => {
    await modal.setLotLabel('VITAMINE-A');
    await TU.modal.submit();
    await GU.expectRowCount(gridId, [4 + depotGroupingRow, 7 + depotGroupingRow]);
  });

  test('find by lots reasons for purchase order', async () => {
    await modal.setMovementReason(['From Purchase Order']);
    await modal.submit();
    await GU.expectRowCount(gridId, [2 + depotGroupingRow, 3 + depotGroupingRow]);
  });

  test('find by lots reasons for allocation to patient', async () => {
    // to patient
    await modal.setMovementReason(['To Patient']);
    await modal.submit();
    await GU.expectRowCount(gridId, [3 + depotGroupingRow, 2 + depotGroupingRow]);
  });

  test('find by lots reasons for allocation to depot', async () => {
    await modal.setMovementReason(['To Depot']);
    await modal.submit();
    await GU.expectRowCount(gridId, [1 + depotGroupingRow, 2 + depotGroupingRow]);
  });

  test('find by lots reasons for allocation from depot', async () => {
    await modal.setMovementReason(['From Depot']);
    await modal.submit();
    await GU.expectRowCount(gridId, [0, 2]);
  });

  test('find by lots reasons for positive adjustement', async () => {
    await modal.setMovementReason(['Adjustment (Positive)']);
    await modal.submit();
    await GU.expectRowCount(gridId, 0);
  });

  test('find by lots reasons for negative adjustement', async () => {
    await modal.setMovementReason(['Adjustment (Negative)']);
    await modal.submit();
    await GU.expectRowCount(gridId, 0);
  });

  test('find movements by reference', async () => {
    await modal.setReference(REFERENCE);
    await modal.submit();
    await GU.expectRowCount(gridId, [1 + depotGroupingRow, 0]);
  });

}

module.exports = StockMovementsRegistryTests;
