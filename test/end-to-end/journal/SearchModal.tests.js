const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const Filters = require('../shared/components/bhFilters');
const SearchModal = require('./SearchModal.page');
const JournalPage = require('./journal.page');

function JournalSearchTests() {
  const path = '/#!/journal';
  const NUM_UNPOSTED_ROWS = 11;
  const page = new JournalPage();

  test.beforeEach(async () => TU.navigate(path));

  let modal;
  let filters;

  test.beforeEach(async () => {
    // await TU.buttons.search();
    modal = new SearchModal(path);
    await modal.open();
    filters = new Filters();
  });

  test.afterEach(async () => {
    await filters.resetFilters();
  });

  test(`loads at least ${NUM_UNPOSTED_ROWS} unposted rows from the database`, async () => {
    await modal.close();
    await page.expectRowCountAbove(NUM_UNPOSTED_ROWS);
  });

  const NUM_ACCOUNT_CHURCH = [2, 4];
  test(`should have ${NUM_ACCOUNT_CHURCH} rows for the church account`, async () => {
    await modal.setAccount('41111010');
    await modal.submit();
    await page.expectRowCount(NUM_ACCOUNT_CHURCH);
  });

  const PATIENT_REFERENCE = 'PA.TPA.2';
  const NUMBER_OF_REFERENCED_LINES = [2, 5];
  test(`finds ${NUMBER_OF_REFERENCED_LINES} rows for patient reference ${PATIENT_REFERENCE}`, async () => {
    await modal.setEntity(PATIENT_REFERENCE);
    await modal.submit();
    await page.expectRowCount(NUMBER_OF_REFERENCED_LINES);
  });

  const TOTAL_TRANSACTION_LINES_REFERENCED = [4, 10];
  test('shows more rows when "showFullTransaction" option is set', async () => {
    await modal.setEntity(PATIENT_REFERENCE);
    await modal.showFullTransactions(true);
    await modal.submit();
    await page.expectRowCount(TOTAL_TRANSACTION_LINES_REFERENCED);
  });

  const NUM_TXN_TYPE_TRANSFER = 2;
  const TXN_TYPE = 'Transfer of the funds Auxiliary cashbox';
  test(`finds ${NUM_TXN_TYPE_TRANSFER} rows for transfer transaction type`, async () => {
    await modal.setTransactionType([TXN_TYPE]);
    await modal.submit();
    await page.expectRowCount(NUM_TXN_TYPE_TRANSFER);
  });

  const NUM_CASH_ROWS = 2;
  const CASH_RECORD = 'CP.TPA.1';
  test(`finds ${NUM_CASH_ROWS} rows for record ${CASH_RECORD}`, async () => {
    await modal.setRecord(CASH_RECORD);
    await modal.submit();
    await page.expectRowCount(NUM_CASH_ROWS);
  });

  const NUM_REFERENCED_ROWS = [4, 8];
  const INVOICE_REFERENCE = 'IV.TPA.1';
  test(`finds ${NUM_REFERENCED_ROWS} rows for reference ${INVOICE_REFERENCE}`, async () => {
    await modal.setReference(INVOICE_REFERENCE);
    await modal.submit();
    await page.expectRowCount(NUM_REFERENCED_ROWS);
  });
}

module.exports = JournalSearchTests;
