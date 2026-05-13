const moment = require('moment');

const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const GU = require('../shared/GridUtils');
const SearchModal = require('../shared/search.page');
const Filters = require('../shared/components/bhFilters');
const components = require('../shared/components');

/**
 *
 */
function StockLotsRegistryTests() {
  const path = '/#!/stock/lots';
  let modal;
  let filters;

  // navigate to the page
  test.beforeEach(async () => {
    await TU.navigate(path);
    modal = new SearchModal('stock-lots-search', path);
    await modal.open();
    filters = new Filters();
  });

  test.afterEach(async () => {
    await filters.resetFilters();
  });

  const gridId = 'stock-lots-grid';

  const depotGroupingRow = 1;

  const inventoryGroup = 'Injectable';

  test(`finds lots for today`, async () => {
    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('today');
    await TU.modal.submit();

    await GU.expectRowCount(gridId, [12, 15]);
  });

  test(`finds lots for this last year`, async () => {
    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('lastYear');
    await modal.submit();
    await GU.expectRowCount(gridId, [12, 15]);
  });

  test(`finds lots for all time`, async () => {
    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('allTime');
    await modal.submit();
    await GU.expectRowCount(gridId, [12, 15]);
  });

  test('find lots in depot principal', async () => {
    await modal.setDepot('Depot Principal');
    await modal.submit();
    await GU.expectRowCount(gridId, [7 + depotGroupingRow, 17 + depotGroupingRow]);
  });

  test('find lots by inventory', async () => {
    await modal.setInventory('DORA_QUIN1S-_0'); // Quinine Bichlorhydrate, sirop, 100mg base/5ml, 100ml, flacon, Unité
    await modal.submit();
    await GU.expectRowCount(gridId, [3 + depotGroupingRow, 8 + depotGroupingRow]);
  });

  test('find lot by name', async () => {
    await modal.setLotLabel('VITAMINE-A');
    await modal.submit();
    await GU.expectRowCount(gridId, [1 + depotGroupingRow, 3 + depotGroupingRow]);
  });

  test('find lots by expiration date', async () => {
    const yearSubstract3 = moment(new Date(), 'YYYY').subtract(3, 'year');
    const formatYear = moment(yearSubstract3).format('YYYY');

    const startDate = `${formatYear}-01-01`;
    const endDate = `${formatYear}-12-31`;

    await modal.setdateInterval(
      moment(startDate).format('DD/MM/YYYY'),
      moment(endDate).format('DD/MM/YYYY'),
      'expiration-date',
    );

    await modal.submit();
    await GU.expectRowCount(gridId, [0, 4]);
  });

  test('Find the lots with a risk of expiry', async () => {
    await components.yesNoRadios.set('yes', 'isExpiryRisk');
    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('allTime');

    await modal.submit();
    await GU.expectRowCount(gridId, [0, 2]);
  });

  test('Find the lots with no risk of expiry', async () => {
    await components.yesNoRadios.set('no', 'isExpiryRisk');
    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('allTime');

    await modal.submit();
    await GU.expectRowCount(gridId, [12, 14]);
  });

  test('find inventories by group', async () => {
    await components.inventoryGroupSelect.set(inventoryGroup);
    await TU.modal.submit();
    await GU.expectRowCount(gridId, [3, 5]);
    await filters.resetFilters();
  });

}

module.exports = StockLotsRegistryTests;
