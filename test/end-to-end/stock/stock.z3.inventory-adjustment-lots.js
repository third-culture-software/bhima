const { chromium } = require('@playwright/test');
const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const GU = require('../shared/GridUtils');
const SearchModal = require('../shared/search.page');
const Filters = require('../shared/components/bhFilters');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

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
  const GROUPING_ROW = 1;

  test(`finds lots for all time`, async () => {
    await modal.setDepot('Depot Principal');
    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('allTime');
    await modal.submit();
    await GU.expectRowCount(gridId, [GROUPING_ROW + 3, GROUPING_ROW + 7]);
  });

  test('find only lots set during the adjustment process', async () => {

    // const quinine = {
    //   label : 'Quinine Bichlorhydrate, sirop, 100mg base/5ml, 100ml, flacon, Unité',
    //   code : 'DORA_QUIN1S-_0',
    //   lot : 'QUININE-C',
    //   quantity : '17',
    //   row : 2,
    // };
    const vitamins = {
      label : 'Vitamines B1+B6+B12, 100+50+0.5mg/2ml, Amp, Unité',
      code : 'DINJ_TRIB1A2_0',
      lot : 'VITAMINE-B',
      quantity : '23',
      row : 1,
    };
    const moto1 = {
      label : 'Honda CRF250RX',
      code : 'MOT.HCRF250RX',
      lot : 'MOT2',
      quantity : '1',
      row : 7,
    };
    const moto2 = {
      label : 'Honda CRF250RX',
      code : 'MOT.HCRF250RX',
      lot : 'MOT1',
      quantity : '1',
      row : 6,
    };

    await modal.setDepot('Depot Principal');

    // set the default value for include/exclude exhausted lots.
    await modal.switchToDefaultFilterTab();
    await TU.locator('[data-exclude-exhausted-lots]').click();

    await modal.submit();

    await GU.expectCellValueMatch(gridId, vitamins.row, 1, vitamins.code);
    await GU.expectCellValueMatch(gridId, vitamins.row, 2, vitamins.label);
    await GU.expectCellValueMatch(gridId, vitamins.row, 4, vitamins.lot);
    await GU.expectCellValueMatch(gridId, vitamins.row, 5, vitamins.quantity);

    await GU.expectCellValueMatch(gridId, moto1.row, 1, moto1.code);
    await GU.expectCellValueMatch(gridId, moto1.row, 2, moto1.label);
    await GU.expectCellValueMatch(gridId, moto1.row, 4, moto1.lot);
    await GU.expectCellValueMatch(gridId, moto1.row, 5, moto1.quantity);

    await GU.expectCellValueMatch(gridId, moto2.row, 1, moto2.code);
    await GU.expectCellValueMatch(gridId, moto2.row, 2, moto2.label);
    await GU.expectCellValueMatch(gridId, moto2.row, 4, moto2.lot);
    await GU.expectCellValueMatch(gridId, moto2.row, 5, moto2.quantity);

    await filters.resetFilters();
  });

}

module.exports = StockLotsRegistryTests;
