const { chromium } = require('@playwright/test');
const { test } = require('@playwright/test');

const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const { notification, accountSelect, modalAction } = require('../shared/components');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('Cashboxes', () => {
  test.beforeEach(async () => {
    await TU.navigate('/#!/cashboxes');
  });

  const cashbox = {
    label   : 'Test Principal Cashbox',
    type    : 1,
    project : 'Test Project A',
  };

  /**
   *
   * @param label
   */
  function update(label) {
    return TU.locator(`[data-cashbox="${label}"]`).click();
  }

  test('creates a new cashbox', async () => {
    // switch to the create form
    await TU.buttons.create();

    // Wait for the create form to appear
    await TU.waitForSelector(by.name('CreateForm'));

    await TU.input('UpdateCtrl.box.label', cashbox.label);
    await TU.radio('UpdateCtrl.box.is_auxiliary', cashbox.type);
    await TU.select('UpdateCtrl.box.project_id', 'Test Project A');

    // submit the page to the server
    await TU.buttons.submit();

    // make sure the success message shows
    await notification.hasSuccess();
  });

  test('successfully edits a cashbox', async () => {
    // navigate to the update form for the second item
    await update('Caisse Principale');

    // Wait for the update form to appear
    await TU.waitForSelector(by.name('UpdateForm'));

    await TU.input('UpdateCtrl.box.label', 'New Cashbox Name');
    await TU.radio('UpdateCtrl.box.is_auxiliary', cashbox.type);

    await TU.buttons.submit();

    // make sure the success message shows
    await notification.hasSuccess();
  });

  // @TODO : Fix; works fine alone and locally, but fails in CI
  test('allows the user to change currency accounts', async () => {
    // navigate to the update form for the second item
    await update('New Cashbox Name');

    // Wait for the update form to appear
    await TU.waitForSelector(by.name('UpdateForm'));

    // get the "FC" (congolese francs) currency
    await TU.locator('[data-currency-id="1"]').click();

    // confirm that the modal appears
    await TU.waitForSelector('.modal-dialog');
    await TU.waitForSelector(by.name('CashboxModalForm'));

    await accountSelect.set('Gain de change', 'account-id');
    await accountSelect.set('Différences de change', 'transfer-account-id');

    // submit the modal
    await TU.modal.submit();

    // confirm that the success feedback message was displaced
    await notification.hasSuccess();
  });

  // forget to change the gain exchange account id
  test('rejects a missing account on the currency modal', async () => {
    const cashboxName = 'New Test Cashbox';
    // First create a new cashbox
    await TU.buttons.create();

    // Wait for the create form to appear
    await TU.waitForSelector(by.name('CreateForm'));

    await TU.input('UpdateCtrl.box.label', cashboxName);
    await TU.radio('UpdateCtrl.box.is_auxiliary', 1);
    await TU.select('UpdateCtrl.box.project_id', 'Test Project A');

    // submit the page to the server
    await TU.buttons.submit();
    await notification.hasSuccess();

    // Now edit it to set the currency and accoutns
    await update(cashboxName);

    // get a locator for the currencies (USD)
    await TU.locator('[data-currency-id="2"]').click();

    // confirm that the modal appears
    // ??? await TU.exists('[uib-modal-window]', true);
    await TU.waitForSelector('[uib-modal-window]');

    await accountSelect.set('60511010', 'account-id');

    // Now try to submit the modal without selecting a transfer account
    // The submit should fail, leaving the modal up
    await TU.modal.submit();

    // confirm that the modal did not disappear
    await TU.exists('[uib-modal-window]');

    // Verify that there is an error message
    await TU.exists(by.containsText('This field cannot be empty'));

    // Now set the transfer account and submit again
    await accountSelect.set('NGO', 'transfer-account-id');

    await TU.modal.submit();
    await notification.hasSuccess();
  });

  test('allows you to delete a cashbox', async () => {
    // navigate to the update form for the second item
    await update(cashbox.label);

    // click the "delete" button
    await TU.buttons.delete();

    // confirm the deletion
    await modalAction.confirm();

    await notification.hasSuccess();
  });

  test('performs form validation', async () => {
    // switch to the create form
    await TU.buttons.create();

    // try to submit to the server.
    await TU.buttons.submit();

    // everything should have error highlights
    // TU.validation.error('UpdateCtrl.box.project_id');
    await TU.validation.error('UpdateCtrl.box.label');

    await notification.hasDanger();
  });
});
