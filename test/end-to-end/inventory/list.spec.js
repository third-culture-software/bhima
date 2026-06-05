const { chromium } = require('@playwright/test');
const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const GU = require('../shared/GridUtils');
const components = require('../shared/components');

const Filters = require('../shared/components/bhFilters');
const SearchModal = require('../shared/search.page');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('Inventory List', () => {

  const path = '/#!/inventory';
  let modal;

  const filters = new Filters();
  const currentDate = new Date();
  const uniqueIdentifier = currentDate.getTime().toString();

  // navigate to the page
  test.beforeEach(async () => {
    await TU.navigate(path);
    modal = new SearchModal('inventory-search', path);
  });

  test.afterEach(async () => {
    await filters.resetFilters();
  });

  // inventory list items
  const metadata = {
    code  : uniqueIdentifier,
    text  : '[E2E] Inventory Article',
    price : 7.57,
    group : 'Produits Injectables',
    type  : 'Article',
    unit  : 'unit',
    unit_weight : 1,
    unit_volume : 1,
    purchase_interval : 1,
    tags : 'Medicament Traceur',
  };

  const metadataUpdate = {
    text : 'Stavudine 40mg + Lamuvidune 150mg, ces, 60, vrac',
    price : 7.77,
    group : 'Produits Injectables',
    type  : 'Article',
    unit  : 'pill',
    unit_weight : 7,
    unit_volume : 7,
    tags : 'Virologie',
    note : 'Price updated',
  };

  const metadataSearch = {
    label : 'Quinine',
    group : 'Eau',
    type  : 'Article',
    tag   : 'Medicament Traceur',
    tags  : ['Medicament Traceur', 'Virologie'],
  };

  test('successfully creates a new inventory item (metadata)', async () => {

    // filter inventory size  to 5 so it takes less time to load
    await modal.open();
    await modal.switchToDefaultFilterTab();
    await TU.input('ModalCtrl.defaultQueries.limit', 5, modal.element);
    await TU.modal.submit();

    await TU.buttons.create();
    await TU.input('$ctrl.item.label', metadata.text);
    await TU.input('$ctrl.item.code', metadata.code);
    await TU.locator(by.model('$ctrl.item.consumable')).click();
    await TU.input('$ctrl.item.price', metadata.price);
    await TU.uiSelect('$ctrl.item.group_uuid', metadata.group);
    await TU.select('$ctrl.item.type_id', metadata.type);
    await TU.uiSelect('$ctrl.item.unit_id', metadata.unit);
    await TU.input('$ctrl.item.unit_weight', metadata.unit_weight);
    await TU.input('$ctrl.item.unit_volume', metadata.unit_volume);
    await TU.input('$ctrl.item.purchase_interval', metadata.purchase_interval);
    await components.tagSelect.set(metadata.tags);

    await TU.modal.submit();
    await components.notification.hasSuccess();

    await modal.open();

    // Restore defaults
    await modal.switchToDefaultFilterTab();
    await TU.input('ModalCtrl.defaultQueries.limit', 1000, modal.element);
    await TU.modal.submit();
  });

  const CODE_TO_UPDATE = 'DARV_LSTA4T6_0';

  test('successfully updates an existing inventory item (metadata)', async () => {

    // since we have thousands of inventory items, first we need to filter to find it.
    await modal.open();
    await TU.input('ModalCtrl.searchQueries.code', CODE_TO_UPDATE);
    await TU.modal.submit();

    await GU.expectRowCount('inventoryListGrid', [1, 23]);

    // now we can actually update it.
    const row = await TU.locator(`[data-row-item="${CODE_TO_UPDATE}"]`);
    await row.locator('[data-method="action"]').click();
    await TU.locator(`[data-edit-metadata="${CODE_TO_UPDATE}"]`).click();
    await TU.input('$ctrl.item.label', metadataUpdate.text);
    await TU.locator(by.model('$ctrl.item.consumable')).click();
    await TU.input('$ctrl.item.price', metadataUpdate.price);
    await TU.uiSelect('$ctrl.item.group_uuid', metadataUpdate.group);
    await TU.select('$ctrl.item.type_id', metadataUpdate.type);
    await TU.uiSelect('$ctrl.item.unit_id', metadataUpdate.unit);
    await TU.input('$ctrl.item.unit_weight', metadataUpdate.unit_weight);
    await TU.input('$ctrl.item.unit_volume', metadataUpdate.unit_volume);
    await components.tagSelect.set(metadataUpdate.tags);
    await TU.input('$ctrl.item.note', metadataUpdate.note);
    await TU.modal.submit();
    await components.notification.hasSuccess();
  });

  // demonstrates that filtering works
  test(`should find 21 inventory items with the label "${metadataSearch.label}"`, async () => {
    await modal.open();
    await modal.reset();

    await TU.input('ModalCtrl.searchQueries.text', metadataSearch.label);

    await TU.modal.submit();

    await GU.expectRowCount('inventoryListGrid', 21);
  });

  // demonstrates that filtering works
   
  test(`should find 17 inventory items with group "${metadataSearch.group}" and type "${metadataSearch.type}"`, async () => {
    await modal.open();
    await modal.reset();

    await components.inventoryGroupSelect.set(metadataSearch.group);
    await components.inventoryTypeSelect.set(metadataSearch.type);

    await TU.modal.submit();

    await GU.expectRowCount('inventoryListGrid', 17);
  });

  // @TODO: Fix.  Works alone but fails with other tests
  test.skip(`should find 1 inventory item with tag string "${metadataSearch.tag}"`, async () => {
    await modal.open();
    await modal.reset();

    await components.tagSelect.set(metadataSearch.tag);

    await TU.modal.submit();

    await GU.expectRowCount('inventoryListGrid', 1);
  });

  // @TODO : Fix; works fine alone but fails with all tests
  test.skip(`should find inventory items within this tags array [${metadataSearch.tags}]`, async () => {
    await modal.open();
    await modal.reset();

    await components.tagSelect.set(metadataSearch.tags);

    await TU.modal.submit();

    await GU.expectRowCount('inventoryListGrid', [1, 2]);
  });

  test('do not create a new inventory item (metadata) for invalid data', async () => {
    await TU.buttons.create();
    await TU.input('$ctrl.item.label', metadata.text);
    await TU.input('$ctrl.item.unit_weight', metadata.unit_weight);
    await TU.input('$ctrl.item.unit_volume', metadata.unit_volume);
    await TU.modal.submit();

    // check validations
    await TU.validation.ok('$ctrl.item.label');
    await TU.validation.ok('$ctrl.item.unit_weight');
    await TU.validation.ok('$ctrl.item.unit_volume');
    await TU.validation.error('$ctrl.item.code');
    await TU.validation.error('$ctrl.item.price');
    await TU.validation.error('$ctrl.item.group_uuid');
    await TU.validation.error('$ctrl.item.type_id');
    await TU.validation.error('$ctrl.item.unit_id');
    await TU.buttons.cancel();
  });

});
