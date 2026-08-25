const { chromium } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const TU = require('../../shared/TestUtils');

const { setTimeout } = require('node:timers/promises');

const components = require('../../shared/components');

/* loading pages */
const AccountReferencePage = require('./account-reference.page');
const AccountReferenceCreateUpdatePage = require('./account-reference.cu.page');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('AccountReference Management Page', () => {
  const path = '/#!/account_reference';

  const mockCreate = {
    abbr : 'AO',
    description : 'Test Accounts Reference',
    is_amo_dep : 0,
    accounts : ['31110010', '31110011', '57110010', '57110011'],
    accountsException : ['31110011', '57110011'],
    reference_type_id : 'Profit and loss', // 'Compte de Résultat'
  };

  const mockCreate2 = {
    abbr : 'AA',
    description : 'Test Accounts Reference',
    is_amo_dep : 0,
    accounts : ['31110010', '31110011', '57110010', '57110011'],
    accountsException : ['31110011', '57110011'],
    parent : 'AO',
  };

  const mockEdit = {
    abbr : 'BD',
    description : 'Updated Test Accounts Reference',
    is_amo_dep : 1,
    accounts : ['31110010', '31110011'],
    accountsException : ['31110011'],
  };

  const mockSearch = {
    abbr : 'p_test_3',
    description : 'Test 3',
    account : '603',
    reference_type_id : 'Profit and loss', // 'Compte de Résultat'
    accountNull : '1013',
  };

  const numReferences = 13;

  let arPage;

  test.beforeEach(async () => {
    await TU.navigate(path);

    // Force waiting for the grid to appear
    await TU.waitForSelector('.ui-grid-header-cell-wrapper');

    arPage = await AccountReferencePage.new();
  });

  test(`should begin with ${numReferences} account references`, async () => {
    expect(await arPage.count()).toBe(numReferences);
  });

  test('creates an account reference successfully', async () => {
    await arPage.create();

    const modal = new AccountReferenceCreateUpdatePage();
    await modal.init();

    await modal.setAbbr(mockCreate.abbr);
    await modal.setDescription(mockCreate.description);
    await modal.setAccountValues(mockCreate.accounts);
    await modal.setAccountExceptionValues(mockCreate.accountsException);
    await components.accountReferenceTypeSelect.set(mockCreate.reference_type_id, 'reference_type_id');

    await modal.submit();
    await components.notification.hasSuccess();

    await TU.waitForGridLoaded(); 

    expect(await arPage.count()).toBe(numReferences + 1);
  });

  test('creates an accounts reference with a parent', async () => {
    await arPage.create();
    const modal = new AccountReferenceCreateUpdatePage();
    await modal.init();

    await modal.setAbbr(mockCreate2.abbr);
    await modal.setDescription(mockCreate2.description);
    await modal.setAccountValues(mockCreate2.accounts);
    await modal.setAccountExceptionValues(mockCreate2.accountsException);
    await modal.setParentValue(mockCreate2.parent);
    await modal.submit();
    await components.notification.hasSuccess();

    await TU.waitForGridLoaded(); 

    expect(await arPage.count()).toBe(numReferences + 2);
  });

  test('edits an accounts reference successfully', async () => {
    await arPage.update(mockCreate2.abbr);
    const modal = new AccountReferenceCreateUpdatePage();
    await modal.init();

    await modal.clearSelectedAccounts();
    expect(await modal.numSelectedAccounts()).toBe(0);
    await modal.setAccountValues(mockEdit.accounts);

    await modal.clearSelectedAccountExceptions();
    expect(await modal.numSelectedAccountExceptions()).toBe(0);
    await modal.setAccountExceptionValues(mockEdit.accountsException);

    await modal.setAbbr(mockEdit.abbr);
    await modal.setDescription(mockEdit.description);
    await modal.clickIsAmoDep();

    await modal.submit();
    await components.notification.hasSuccess();

    await TU.waitForGridLoaded(); 
  });

  test('Search account references by description', async () => {
    await arPage.search();
    const modal = new AccountReferenceCreateUpdatePage();
    await modal.init();
    await modal.searchDescription(mockSearch.description);
    await modal.submit();

    await TU.waitForGridLoaded(); 

    expect(await arPage.count()).toBe(2);
    await modal.clearFilters();
  });

  test(`search account references by account number (${mockSearch.account})`, async () => {
    await arPage.search();
    const modal = new AccountReferenceCreateUpdatePage();
    await modal.init();
    await modal.searchAccount(mockSearch.account);
    await modal.submit();

    await TU.waitForGridLoaded(); 

    expect(await arPage.count()).toBe(3);
    await modal.clearFilters();
  });

  test(`Search account references by null account number (${mockSearch.accountNull})`, async () => {
    await arPage.search();
    const modal = new AccountReferenceCreateUpdatePage();
    await modal.init();
    await modal.searchAccount(mockSearch.accountNull);
    await modal.submit();

    await TU.waitForGridEmpty(); 

    expect(await arPage.count()).toBe(0);
    await modal.clearFilters();
  });

  test(`Search account references by reference account type (${mockSearch.reference_type_id})`, async () => {
    await arPage.search();
    const modal = new AccountReferenceCreateUpdatePage();
    await modal.init();
    await modal.searchReferenceType(mockSearch.reference_type_id);
    await modal.submit();

    await TU.waitForGridLoaded(); 

    expect(await arPage.count()).toBe(1);
    await modal.clearFilters();
  });

  test('delete an accounts reference successfully', async () => {
    await arPage.remove(mockEdit.abbr);
    await components.notification.hasSuccess();
    expect(await arPage.count()).toBe(numReferences + 1);
  });

  test(`should end with ${numReferences + 1} account references`, async () => {
    expect(await arPage.count()).toBe(numReferences + 1);
  });

  test(`Search account references by reference (${mockSearch.abbr})`, async () => {
    await arPage.search();
    const modal = new AccountReferenceCreateUpdatePage();
    await modal.init();
    await modal.searchAbbr(mockSearch.abbr);
    await modal.submit();

    await TU.waitForGridLoaded(); 

    expect(await arPage.count()).toBe(1);
    await modal.clearFilters();
  });
});
