const { test, expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const Filters = require('../shared/components/bhFilters');
const SearchModal = require('../shared/search.page');
const components = require('../shared/components');

/**
 *
 */
function PurchaseOrderSearch() {
  const path = '/#!/purchases';
  let modal;
  let filters;
  let grid;

  const parameters = {
    reference : 'PO.TPA.2',
    name1 : 'Patient',
    author : 'Super User',
    inventory : 'Quinine Bichlorhydrate, sirop, 100mg base',
    status : ['Confirmed'],
    supplier : 'SNEL',
  };

  test.beforeEach(async () => {
    await TU.navigate(path);
    grid = await TU.locator(by.id('purchase-registry'));
    modal = new SearchModal('purchase-search', path);
    await modal.open();
    filters = new Filters();
  });

  test.afterEach(async () => {
    await filters.resetFilters();
  });

  /**
   * Check to see if the desired number of rows are present
   * @param {number} number - expected number of rows
   */
  async function expectNumberOfGridRows(number) {
    const rows = await grid.locator('.ui-grid-render-container-body')
      .locator(by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows track by $index'))
      .all();
    if (Array.isArray(number)) {
      expect(new Set(number),
        `Expected Patient Registry ui-grid's row count to be in ${number}.`).toContain(rows.length);
    } else {
      expect(rows.length,
        `Expected Patient Registry ui-grid's row count to be ${number}.`).toBe(number);
    }
  }

  test('grid should have 0 visible rows', async () => {
    const DEFAULT_PURCHASES_FOR_TODAY = 0;
    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('today');
    await TU.modal.submit();

    await expectNumberOfGridRows(DEFAULT_PURCHASES_FOR_TODAY);
  });

  // demonstrates that filtering works
  test(`should find one Purchase Order with Reference "${parameters.reference}" for all time`, async () => {
    const NUM_MATCHING = 1;
    await modal.setReference(parameters.reference);

    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('allTime');
    await TU.modal.submit();

    await expectNumberOfGridRows(NUM_MATCHING);
  });

  test(`should find Purchases Orders authored By "${parameters.author}" for all time`, async () => {
    const NUM_MATCHING = [3, 4];
    await modal.setUser(parameters.author);

    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('allTime');
    await TU.modal.submit();

    await expectNumberOfGridRows(NUM_MATCHING);
  });

  test(`should list all purchase orders ordered to "${parameters.supplier}" for all time`, async () => {
    const NUM_MATCHING = [3, 4];
    await modal.setSupplier(parameters.supplier);

    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('allTime');
    await TU.modal.submit();

    await expectNumberOfGridRows(NUM_MATCHING);
  });

  test(`should list all purchase orders with "${parameters.inventory}" for all time`, async () => {
    const NUM_MATCHING = 2;
    await modal.setInventory(parameters.inventory);

    await modal.switchToDefaultFilterTab();
    await modal.setPeriod('allTime');
    await TU.modal.submit();

    await expectNumberOfGridRows(NUM_MATCHING);
  });

  test(`choose the status confirmed and should find two purchases orders status by "${parameters.status}" for all time`,
    async () => {
      const NUM_MATCHING = 1;
      await components.purchaseStatusSelect.set(parameters.status);
      await modal.switchToDefaultFilterTab();
      await modal.setPeriod('allTime');
      await TU.modal.submit();

      await expectNumberOfGridRows(NUM_MATCHING);
    });
}

module.exports = PurchaseOrderSearch;
