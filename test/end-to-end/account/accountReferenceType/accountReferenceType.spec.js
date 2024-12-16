const { chromium } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const TU = require('../../shared/TestUtils');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

const AccountReferenceType = require('./accountReferenceType.page');

test.describe('Account Reference Type', () => {
  let page;

  // navigate to the page
  const path = '/#!/account_reference_type';
  test.beforeEach(async () => {
    await TU.navigate(path);
    await TU.waitForSelector('div[role="rowgroup"]'); // Wait for grid to appear
    page = new AccountReferenceType();
    page.init();
  });

  const newAccountReferenceType = {
    label : 'Test Account Reference Type',
  };

  const updateAccountReferenceType = {
    label : 'Update Account Reference Type',
  };

  test('begins with 8 Account Reference Type', async () => {
    expect(await page.count()).toBe(8);
  });

  test('successfully creates a new Account Reference Type', async () => {
    await page.create(newAccountReferenceType);
  });

  test('successfully edits a Account Reference Type', async () => {
    await page.update(newAccountReferenceType.label, updateAccountReferenceType);
  });

  test('errors when missing Account Reference Type create when incorrect Account Reference Type', async () => {
    await page.errorOnCreateAccountReferenceType();
  });

  test('successfully delete Account Reference Type', async () => {
    await page.remove(updateAccountReferenceType.label);
  });
});
