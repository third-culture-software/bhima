const { chromium } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const components = require('../shared/components');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('Creditor Groups Management', () => {
  const path = '/#!/creditors/groups/';
  test.beforeEach(async () => {
    await TU.navigate(path);
  });

  const INITIAL_GROUP = 4;

  const currentDate = new Date();
  const uniqueIdentifier = currentDate.getTime().toString();

  const group = {
    name         : `E2E Creditor Group ${uniqueIdentifier}`,
    delete_name  : 'SNEL',
    updated_name : `E2E Creditor Group Updated ${uniqueIdentifier}`,
    account      : '40111000', // 40111000 - SNEL SUPPLIER
  };

  async function numEntries() {
    await TU.waitForSelector('[data-group-entry]');
    return (await TU.locator('[data-group-entry]')).count();
  }

  test(`has an initial list of ${INITIAL_GROUP} creditor groups`, async () => {
    expect(await numEntries()).toBe(INITIAL_GROUP);
  });

  test('creates a creditor group', async () => {
    await TU.buttons.create();
    await TU.waitForSelector('input[name="name"]');
    await TU.input('CreditorGroupCtrl.bundle.name', group.name);
    await components.accountSelect.set(group.account);
    await TU.buttons.submit();

    await components.notification.hasSuccess();
    expect(await numEntries()).toBe(INITIAL_GROUP + 1);
  });

  test('updates a creditor group', async () => {
    const update = await TU.locator(`[data-update="${group.name}"]`);
    await update.click();
    await TU.input('CreditorGroupCtrl.bundle.name', group.updated_name);
    await TU.locator(by.model('CreditorGroupCtrl.bundle.locked')).click();

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });

  test('deletes a creditor group', async () => {
    await TU.waitForSelector(`[data-update="${group.updated_name}"]`);
    await TU.locator(`[data-update="${group.updated_name}"]`).click();

    // click the "delete" button
    await TU.buttons.delete();
    await TU.modal.submit(); // Confirm the deletion

    await components.notification.hasSuccess();
  });

  test('blocks deletion of a creditor group used in a transaction', async () => {
    await TU.locator(`[data-update="${group.delete_name}"]`).click();

    // click the "delete" button
    await TU.buttons.delete();

    await TU.modal.submit();
    await components.notification.hasError();
  });
});
