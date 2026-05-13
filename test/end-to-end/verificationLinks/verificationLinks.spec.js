const { chromium } = require('@playwright/test');
const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const Filters = require('../shared/components/bhFilters');
const GU = require('../shared/GridUtils');
const GridRow = require('../shared/GridRow');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('Check Inter-Registry Links', () => {
  const path = '/#!/';
  const filters = new Filters();

  test.beforeEach(async () => {
    await TU.navigate(path);
  });

  test.afterEach(async () => {
    await filters.resetFilters();
  });

  test('Checks the link between Patient Groups -> Patient Registry', async () => {
    await TU.navigate('/#!/patients/groups');
    const menu = await openDropdownMenu('Test Patient Group 2');
    await menu.goToPatient();

    await GU.expectRowCount('patient-registry', 2);
  });

  // skip until we can re-write the tests to find debtor groups based on name.
  test('Checks the link between Debtor Groups -> Patient Registry', async () => {
    await TU.navigate('/#!/debtors/groups');
    await TU.locator('a [class="fa fa-bars"]').nth(1).click();

    await GU.expectRowCount('patient-registry', [6, 8]);
  });

  test('Checks the link between Patient Registry -> Invoice Registry', async () => {
    await TU.navigate('/#!/patients');
    await TU.waitForSelector('.ui-grid-canvas .ui-grid-row');

    const row = new GridRow('PA.TPA.2');
    await row.dropdown();
    await row.goToInvoices();

    await GU.expectRowCount('invoice-registry', 5);
  });

  test('Checks the link between Invoice Registry -> Cash Registry', async () => {
    await TU.navigate('/#!/invoices');
    await filters.resetFilters();

    const row = new GridRow('IV.TPA.1');
    await row.dropdown();
    await row.goToPayment();

    await GU.expectRowCount('payment-registry', 1);
  });

  test('Checks the link between Inventory Registry -> Invoice Registry', async () => {
    await TU.navigate('/#!/inventory/list');
    await filters.resetFilters();

    // Select a code to find one with invoices
    await TU.locator('[data-method="search"]').click();
    await TU.input('ModalCtrl.searchQueries.code', 'DORA_QUIN1S-_0');
    await TU.modal.submit();

    // Make sure the grid is loaded
    await TU.waitForSelector('.ui-grid-canvas .ui-grid-row');

    await TU.locator('[data-method="action"]').click();
    await TU.locator('[data-method="invoice"]').click();

    await GU.expectRowCount('invoice-registry', 1);
  });

  test('Checks the link between Invoice Registry -> Voucher Registry', async () => {
    await TU.navigate('/#!/invoices');
    await filters.resetFilters();
    const row = new GridRow('IV.TPA.1');
    await row.dropdown();
    await row.goToVoucher();

    await GU.expectRowCount('voucher-grid', [1, 2]);
  });

  test('Checks the link between Cash Registry -> Voucher Registry', async () => {
    await TU.navigate('/#!/payments');
    await filters.resetFilters();
    const row = new GridRow('CP.TPA.1');
    await row.dropdown();
    await row.goToVoucher();

    await GU.expectRowCount('voucher-grid', [1, 2]);
    await filters.resetFilters();
  });

  /**
   *
   * @param label
   */
  async function openDropdownMenu(label) {
    const row = new GridRow(label);
    await row.dropdown();
    return row;
  }
});
