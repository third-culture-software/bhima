const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const GU = require('../shared/GridUtils');

const SearchModal = require('../shared/search.page');
const Filters = require('../shared/components/bhFilters');

module.exports = VoucherRegistrySearch;

/**
 *
 */
function VoucherRegistrySearch() {
  const gridId = 'voucher-grid';
  const NUM_VOUCHERS = 5;

  let modal;
  let filters;

  test.beforeEach(async () => {
    const path = '/#!/vouchers';
    await TU.navigate(path);
    modal = new SearchModal('voucher-search', path);
    await modal.open();
    filters = new Filters();
  });

  test.afterEach(async () => {
    await filters.resetFilters();
  });

  /**
   *
   * @param number
   */
  async function expectNumberOfGridRows(number) {
    await TU.waitForSelector('.ui-grid-footer');
    await GU.expectRowCount(gridId, number, `Expected VoucherRegistry's ui-grid row count to be ${number}.`);
  }

  test('filters vouchers by clicking the month button', async () => {
    await modal.switchToDefaultFilterTab();

    // set the filters to 'This Month'
    await modal.setPeriod('month');

    await TU.modal.submit();

    await expectNumberOfGridRows([NUM_VOUCHERS - 1, NUM_VOUCHERS]);
  });

  test('filters by reference should return a single result', async () => {
    await modal.setReference('VO.TPA.2');
    await TU.modal.submit();
    await expectNumberOfGridRows(1);
  });

  const NUM_USER_RECORDS = [5, 11];
  test(`filters by <select> should return ${NUM_USER_RECORDS} results`, async () => {
    await modal.setUser('Super User');
    await TU.modal.submit();
    await expectNumberOfGridRows(NUM_USER_RECORDS);
  });

  const NUM_VOUCHERS_OTHER_INCOME = [1, 3];
  test(`filters by <select> transaction type should return ${NUM_VOUCHERS_OTHER_INCOME} results`, async () => {
    await modal.setTransactionType(['Other Income']);
    await TU.modal.submit();
    await expectNumberOfGridRows(NUM_VOUCHERS_OTHER_INCOME);
  });

  const NUM_VOUCHERS_OTHER_EXPENSES = [0, 1];
  test(`filters by <select> transaction type should return 0 results`, async () => {
    await modal.setTransactionType(['Other Expenses']);
    await TU.modal.submit();
    await expectNumberOfGridRows(NUM_VOUCHERS_OTHER_EXPENSES);
  });

  const NUM_VOUCHERS_BY_DESCRIPTION = [0, 1];
  test(`filtering by description should return ${NUM_VOUCHERS_BY_DESCRIPTION} results`, async () => {
    await modal.setDescription('Awesome');
    await TU.modal.submit();
    await expectNumberOfGridRows(NUM_VOUCHERS_BY_DESCRIPTION);
  });

}
