const { test, expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const { notification } = require('../shared/components');

const TrialBalancePage = require('./TrialBalance.page');
const Filters = require('../shared/components/bhFilters');
const SearchModal = require('./SearchModal.page');
const JournalPage = require('./journal.page');

/**
 *
 */
function TrialBalanceTest() {
  const page = new JournalPage();
  const trialBalance = new TrialBalancePage();

  const path = '/#!/journal';

  let modal;
  let filters;

  test.beforeEach(async () => {
    await TU.navigate(path);
    modal = new SearchModal(path);
    filters = new Filters();
  });

  test.afterEach(async () => {
    await filters.resetFilters();
  });

  const TXN_A = 'TPA1';
  // const TXN_B = 'TPA7';
  test(`posts multiple transactions (${TXN_A}) to the General Ledger`, async () => {
    await modal.open();
    await modal.setTransactionType(['Invoicing']);
    await modal.submit();

    await page.selectTransaction(TXN_A);
    // await page.selectTransaction(TXN_B);

    await page.openTrialBalanceModal();
    await TU.waitForSelector('.modal-dialog .modal-footer');

    // should have 2 lines
    expect(await trialBalance.countOverviewRows()).toBe(2);

    await trialBalance.submit();
  });

  const POSTED_TXN = 'TPA1';
  test(`blocks ${POSTED_TXN} as it is already posted`, async () => {

    // make sure we have posted records in our view
    await modal.open();
    await modal.showPostedRecords(true);
    await modal.submit();

    // select the posted transaction
    await page.selectTransaction(POSTED_TXN);
    await page.openTrialBalanceModal();

    await notification.hasWarn();
  });
}

module.exports = TrialBalanceTest;
