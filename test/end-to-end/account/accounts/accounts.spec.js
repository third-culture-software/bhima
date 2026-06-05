const { chromium } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const TU = require('../../shared/TestUtils');
const { by } = require('../../shared/TestUtils');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

const AccountsPage = require('./accounts.page');
const components = require('../../shared/components');

test.describe('Account Management', () => {
  const path = '/#!/accounts';
  test.beforeEach(async () => {
    await TU.navigate(path);
    await TU.waitForSelector('.ui-grid-contents-wrapper');
  });

  const INITIAL_ACCOUNTS = 20;
  const OHADA_ACCOUNTS_CSV_FILE = 'ohada-accounts.csv';
  const OHADA_ACCOUNTS_CSV_CHARACTERS_FILE = 'ohada-accounts-characters.csv';
  const BAD_OHADA_ACCOUNTS_CSV_FILE = 'bad-ohada-accounts.csv';

  // this is an account at the top of the grid - until this test is improved it
  // relies on the account being visible to verify each test
  const assetAccountGroup = {
    number : 10,
    child_number : 105, // this is the number ofthe  child account in the group
  };

  const account = {
    number : '10911010',
    type : 'Equity',
    label : 'Compte Actionnaire, Capital souscrit, non appelé',
    parent : { number : '1091' },
  };

  const DELETE_ACCOUNT_NUMBER = 10541010;

  const page = new AccountsPage();

  test('lists initial accounts', async () => {
    await page.expectGridRowsAtLeast(INITIAL_ACCOUNTS);
  });

  test('expands and collapses title accounts on title click', async () => {
    await page.expectRowVisible(assetAccountGroup.child_number);
    await page.toggleTitleRow(assetAccountGroup.number);
    await page.expectRowHidden(assetAccountGroup.child_number);
    await page.toggleTitleRow(assetAccountGroup.number);
  });

  test('create state populates parent field through in-line create', async () => {
    await page.openAddChild(account.parent.number);

    // this relies on the account select to display the account with account number
    expect(await page.EditModal.parent()).toContain(account.parent.number);
    await TU.modal.cancel();
  });

  test('creates a single account', async () => {
    await page.openAddChild(account.parent.number);
    await TU.input('AccountEditCtrl.account.number', '41111019');
    await TU.input('AccountEditCtrl.account.label', 'IMA World Health Account');

    await TU.select('AccountEditCtrl.account.type_id', 'Title');
    await TU.modal.submit();

    await components.notification.hasSuccess();
  });

  test('edit state populates account data on clicking edit', async () => {
    await page.openEdit(account.number);
    expect(await TU.locator(by.id('number-static')).innerText()).toBe(String(account.number));

    // @todo removed to allow types to be updated - this should be reintroduced
    expect(await TU.locator(by.id('type-static')).innerText()).toBe(account.type);
    expect(
      await TU.locator(by.model('AccountEditCtrl.account.label')).inputValue(),
    ).toBe(account.label);
  });

  test('updates an account title and parent', async () => {
    await page.openEdit(account.number);
    await TU.input('AccountEditCtrl.account.label', 'Updated Inventory Accounts');
    await TU.uiSelect('AccountEditCtrl.account.parent', 'Médicaments', null, false, 'fullWord');
    await TU.modal.submit();

    await components.notification.hasSuccess();
  });

  test('creates multiple accounts with the batch option selected', async () => {
    const parentNumber = '7061'; // Services vendus dans la Region ohada

    const accounts = [{
      number : '70611013',
      label : 'Pharmacie',
    }, {
      number : '70611014',
      label : 'Maternite',
    }, {
      number : '70611015',
      label : 'Maternite',
    }];

    await TU.buttons.create();
    const modal = await TU.locator('div.modal-dialog');

    // expect the modal to open
    await TU.exists('[uib-modal-window]', true);

    // set modal to create any number of accounts
    await page.toggleBatchCreate();

    await modal.locator(by.model('AccountEditCtrl.account.type_id')).selectOption('Title');
    // NOTE: could not get to the old way to work:
    //         modal.locator(`[data-key="ACCOUNT.TYPES.${type}"]`).click();

    // set to this parent
    await TU.uiSelect('AccountEditCtrl.account.parent', parentNumber, modal, false, 'fullWord');

    // set to income
    await modal.locator(by.model('AccountEditCtrl.account.type_id')).selectOption('Income');

     
    for (const accnt of accounts) {
       
      await createAccount(accnt);
    }

    await page.toggleBatchCreate();
    await createAccount({ number : '70611016', label : 'Laboratoire' });

    // Wait for the grid to redisplay
    await TU.waitForSelector('div.ui-grid-viewport:visible');

    expect(await TU.isPresent('div:has-text("70611013")'));
    expect(await TU.isPresent('div:has-text("70611014")'));
    expect(await TU.isPresent('div:has-text("70611015")'));
    expect(await TU.isPresent('div:has-text("70611016")'));
  });

  // generic function to create an account in the modal
  /**
   *
   * @param accnt
   */
  async function createAccount(accnt) {
    await TU.input('AccountEditCtrl.account.number', accnt.number);
    await TU.input('AccountEditCtrl.account.label', accnt.label);
    return TU.modal.submit();
  }

  // delete a specific account
  test('can delete a specific account', async () => {
    await TU.reloadPage();
    await page.deleteAccount(DELETE_ACCOUNT_NUMBER);
    await components.notification.hasSuccess();
  });

  test('cannot delete an account with children', async () => {
    await page.deleteAccount(assetAccountGroup.number);
    await components.notification.hasError();
  });

  // import default ohada accounts accounts
  test('import default ohada accounts into the system (option 0)', async () => {
    await page.openImportMenu();
    await page.chooseImportOption(0);
    await TU.modal.submit();
    await components.notification.hasSuccess();
  });

  // import custom ohada accounts
  test('import default ohada accounts into the system (option 1)', async () => {
    await page.openImportMenu();
    await page.chooseImportOption(1);
    await page.uploadFile(OHADA_ACCOUNTS_CSV_FILE);
    await TU.modal.submit();
    await components.notification.hasSuccess();
  });

  // import custom ohada accounts from csv of strings
  test('import default ohada accounts from csv of strings', async () => {
    await page.openImportMenu();
    await page.chooseImportOption(1);
    await page.uploadFile(OHADA_ACCOUNTS_CSV_CHARACTERS_FILE);
    await TU.modal.submit();
    await components.notification.hasSuccess();
  });

  // import custom ohada accounts
  test('do not import accounts from bad file', async () => {
    await page.openImportMenu();
    await page.chooseImportOption(1);
    await page.uploadFile(BAD_OHADA_ACCOUNTS_CSV_FILE);
    await TU.modal.submit();
    await components.notification.hasError();
  });
});
