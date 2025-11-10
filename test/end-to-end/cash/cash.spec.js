const { chromium } = require('@playwright/test');
const { test, expect } = require('@playwright/test');

const components = require('../shared/components');
const TU = require('../shared/TestUtils');
const GU = require('../shared/GridUtils');
const GridRow = require('../shared/GridRow');
const SearchModal = require('../shared/search.page');
const Filters = require('../shared/components/bhFilters');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('Cash Payments', () => {
  const path = '/#!/cash';

  const cashboxB = {
    id : 2,
    text : 'Test Aux Cashbox A',
  };

  const cashboxC = {
    id : 3,
    text : 'Test Aux Cashbox B',
  };

  // this is a shortcut function for clicking an action in the cash page
  async function selectDropdownAction(action) {
    // open the dropdown menu
    await TU.locator('[data-action="open-tools"]').click();

    // get the action and click it
    return TU.locator(`[data-action="${action}"]`).click();
  }

  test.describe('Cashbox Select Interface', () => {

    // test('navigating to /cash/:unknown should send a notification error ', async () => {
    //   // navigate to an invalid cashbox
    //   await TU.navigate(`${path}/unknown`);

    //   // expect the 'cashbox selection' modal to appear
    //   // Note: We cannot just check for [data-cashbox-modal] because
    //   //       Going to an unknown cashbox redirects to the cashbox
    //   //       selection modal so we need to wait for it to appear.

    //   await TU.waitForSelector('[data-cashbox-modal]');

    //   // select a cashbox
    //   await TU.locator('#cashbox-2').click();

    //   await TU.locator('[data-cashbox-modal-submit]').click();

    //   // expect the 'cashbox selection' modal to disappear
    //   await TU.exists('[data-cashbox-modal]', false);
    // });

    test('navigating directly to /cash should be re-routed to selected cashbox after a selection is made', async () => {

      // our target is cashbox B
      const target = `${path}/${cashboxB.id}`;

      // implicitly choose cashbox B by navigating to it directly
      await TU.navigate(target);

      expect(await TU.getCurrentPath()).toBe(target);

      // back to the root path (it should redirect)
      await TU.navigate(path);

      // force the redirect to complete
      await TU.reloadPage({ waitUntil : 'networkidle' });

      // the cashbox selection modal should not appear
      await TU.exists('[data-cashbox-modal]', false);

      // the url should be the original target
      expect(await TU.getCurrentPath()).toBe(target);
    });

    test('should allow a user to select and deselect a cashbox', async () => {
      // the auxiliary cashbox is the target
      const targetAuxiliary1 = `${path}/${cashboxC.id}`;

      await TU.navigate(targetAuxiliary1);

      // verify that we get to the cashboxC page
      expect(await TU.getCurrentPath()).toBe(targetAuxiliary1);

      // the auxiliary cashbox is the target
      const targetAuxiliary2 = `${path}/${cashboxB.id}`;

      // use the button to navigate back to the cashbox select module
      await selectDropdownAction('change-cashbox');

      // select the auxiliary cashbox B displayed
      await TU.locator(`#cashbox-${cashboxB.id}`).click();

      // click on the ok button of the modal box
      await TU.locator('[data-cashbox-modal-submit]').click();

      // verify that we get to the cashboxB page
      expect(await TU.getCurrentPath()).toBe(targetAuxiliary2);
    });
  });

  /* tests for the cash payments form page */
  test.describe('Cash Payments Form Page', () => {
    test.beforeEach(async () => {
      await TU.navigate(path);
    });

    // this code assumes that the find-patient directive is well tested.
    // we should be able to use a patient ID without thinking about the potential
    // failures

    // This caution payment should succeed
    const mockCautionPayment = {
      patientName : 'Test 2',
      amount : 150,
    };

    // This payment against patient invoices should succeed
    const mockInvoicesPayment = {
      patientId : '2', // we are using PA.TPA.X at patient invoice already
      date : new Date('2016-03-01'),
      amount : 5.12,
    };

    test('should make a caution payment', async () => {
      // select the proper patient
      await components.findPatient.findByName(mockCautionPayment.patientName);

      // we will leave the date input as default

      // select the proper is caution type
      const cautionOption = await TU.locator('[data-caution-option="1"]');
      await cautionOption.click();

      // select the FC currency from the currency select
      await components.currencySelect.set(1);

      // enter the amount to pay for a caution
      await components.currencyInput.set(mockCautionPayment.amount);

      // click the submit button
      await TU.buttons.submit();

      // expect the receipt modal to appear
      await TU.waitForSelector('#receipt-confirm-created');

      // dismiss the modal
      await TU.locator('[data-action="close"]').click();
    });

    test('should block invoice payments without invoices', async () => {
      // select the proper patient
      await components.findPatient.findByName(mockCautionPayment.patientName);

      // we will leave the date input as default

      // select the proper is caution type
      const cautionOption = await TU.locator('[data-caution-option="0"]');
      await cautionOption.click();

      // select the FC currency from the currency select
      await components.currencySelect.set(1);

      // enter the amount to pay for a caution
      await components.currencyInput.set(mockCautionPayment.amount);

      // click the submit button
      await TU.buttons.submit();

      // expect a danger notification
      await components.notification.hasDanger();

      await TU.locator('[data-method="clear"]').click();
    });

    test('should make a payment against previous invoices', async () => {
      const gridId = 'debtorInvoicesGrid';

      // select the proper patient
      await components.findPatient.findById(mockInvoicesPayment.patientId);

      // select the proper date
      await components.dateEditor.set(mockInvoicesPayment.date);

      // select the "invoices payment" option type
      const cautionOption = await TU.locator('[data-caution-option="0"]');
      await cautionOption.click();

      // open the invoices modal to select constious invoices
      await TU.exists('[data-open-invoices-btn]', true);
      await TU.locator('[data-open-invoices-btn]').click();

      // make sure that the modal opened
      await TU.waitForSelector('[data-debtor-invoice-modal]');

      // inside the modal, we want to select the first row to pay against
      await GU.selectRow(gridId, 2);

      // submit the modal
      await TU.modal.submit();

      // select the USD currency from the currency radio buttons
      await components.currencySelect.set(2);

      // enter the amount to pay for an invoice
      await components.currencyInput.set(mockInvoicesPayment.amount);

      // click the submit button
      await TU.buttons.submit();

      // expect the receipt modal to appear
      await TU.waitForSelector('#receipt-confirm-created');

      // dismiss the modal
      await TU.locator('[data-action="close"]').click();
    });
  });

  test.describe('Cash transfer', () => {
    test.beforeEach(async () => {
      await TU.navigate(path);
    });

    // this transfer should succeed
    const mockTransfer = { amount : 100 };

    test('should make a transfer between accounts', async () => {
      // open the dropdown menu
      await TU.locator('[data-action="open-tools"]').click();

      // get the transfer button and click it
      await TU.locator('[data-action="transfer"]').click();

      // choose CDF as transfer currency
      await components.currencySelect.set(2, 'transfer-currency-select');

      // set a value in the currency component by model to avoid conflict
      await components.currencyInput.set(mockTransfer.amount, 'transfer-currency-input');

      // submit the modal button
      await TU.modal.submit();

      // expect the receipt modal to appear
      await TU.waitForSelector('#receipt-confirm-created');

      // dismiss the modal
      await TU.locator('[data-action="close"]').click();
    });

  });

  test.describe('Credit Notes', () => {
    test.beforeEach(async () => {
      await TU.navigate('payments');
    });

    test('cancels a payment with a credit note', async () => {
      const row = new GridRow('CP.TPA.1');
      await row.dropdown();
      await row.reverse(); // Eg cancel

      await TU.input('ModalCtrl.cancelCash.description', 'Cancel This Payment');
      await TU.modal.submit();
      await components.notification.hasSuccess();
    });

    test('deletes a cash payment from the database', async () => {
      const modal = new SearchModal('cash-payment-search', 'payments');
      await modal.open();
      await modal.switchToDefaultFilterTab();
      await modal.setPeriod('allTime');
      await modal.setLimit(1000);
      await modal.submit();

      const row = new GridRow('CP.TPA.4');
      await row.dropdown();
      await row.remove();

      // accept the confirm modal
      await TU.modal.submit();

      await components.notification.hasSuccess();
    });

  });

  test.describe('Payments Registry', async () => {

    const PAYMENT_INSIDE_REGISTRY = 3;
    const PAYMENT_PRIMARY_CASHBOX = 0;
    const DEBTOR_GROUP = 'Church Employees';

    const path2 = '/#!/payments';
    let modal;
    let filters;

    test.beforeEach(async () => {
      await TU.navigate(path2);
      modal = new SearchModal('cash-payment-search', path2);
      await modal.open();
      filters = new Filters();
    });

    test.afterEach(async () => {
      await filters.resetFilters();
    });

    test('finds only 1 payment for today', async () => {
      const DEFAULT_PAYMENTS_FOR_TODAY = 1;
      await modal.setExcludeReversed();
      await modal.switchToDefaultFilterTab();
      await modal.setPeriod('today');
      await modal.submit();
      await GU.expectRowCount('payment-registry', DEFAULT_PAYMENTS_FOR_TODAY);
    });

    test('finds 2 payments for this year', async () => {
      const DEFAULT_PAYMENTS_FOR_THIS_YEAR = 2;
      await modal.switchToDefaultFilterTab();
      await modal.setPeriod('year');
      await modal.submit();
      await GU.expectRowCount('payment-registry', DEFAULT_PAYMENTS_FOR_THIS_YEAR);
    });

    test(`finds ${PAYMENT_INSIDE_REGISTRY} payments for all time`, async () => {
      await modal.switchToDefaultFilterTab();
      await modal.setPeriod('allTime');
      await modal.submit();
      await GU.expectRowCount('payment-registry', PAYMENT_INSIDE_REGISTRY);
    });

    test('finds a payment given a reference', async () => {
      await modal.setReference('CP.TPA.1');
      await modal.submit();
      await GU.expectRowCount('payment-registry', 1);
    });

    test('produces an empty grid for an invalid payment', async () => {
      await modal.setReference('NOT_A_REFERENCE');
      await modal.submit();
      await GU.expectRowCount('payment-registry', 0);
    });

    test('finds two payments in the primary cashbox', async () => {
      await modal.setReference('Caisse Principale');
      await modal.submit();
      await GU.expectRowCount('payment-registry', PAYMENT_PRIMARY_CASHBOX);
    });

    test('finds all payments made by the super user', async () => {
      await modal.setUser('Super User');
      await modal.submit();
      await GU.expectRowCount('payment-registry', PAYMENT_INSIDE_REGISTRY);
    });

    test(`finds all payments for debtor group: ${DEBTOR_GROUP}`, async () => {
      // @TODO: Fix this test, which fails sporadically in full test runs
      await components.debtorGroupSelect.set(DEBTOR_GROUP);
      await modal.submit();
      // Accept either 1 or 2 since it depends on the order of parallel tests
      await GU.expectRowCount('payment-registry', [1, 2]);
    });

    test('finds no payments for the disallowed user', async () => {
      await modal.setUser('Regular User');
      await modal.submit();
      await GU.expectRowCount('payment-registry', 0);
    });

  });

});
