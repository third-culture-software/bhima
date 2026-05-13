const { chromium } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const GU = require('../shared/GridUtils');
const components = require('../shared/components');
const GridRow = require('../shared/GridRow');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('Villages Management', () => {
  const path = '/#!/locations/village';

  test.beforeEach(async () => {
    await TU.navigate(path);
  });

  const village = {
    country : 'République Démocratique du Congo',
    province : 'Kinshasa',
    sector : 'Lukunga',
    name : 'New Village',
  };
  const village2 = village;
  village2.name = 'test_village';

  const gridId = 'village-grid';
  const referenceLocation = 'Gombe';

  test('Merge village', async () => {
    // Prevent mixing with no village selected
    await TU.locator(`[data-method="merge"]`).click();
    await components.notification.hasWarn();

    // Prevent mixing with less than two villages
    await GU.selectRow(gridId, 0);
    await TU.locator(`[data-method="merge"]`).click();
    await components.notification.hasWarn();

    // Prevent mixing with more than two villages
    await GU.selectRow(gridId, 1);
    await GU.selectRow(gridId, 2);
    await TU.locator(`[data-method="merge"]`).click();
    await components.notification.hasWarn();

    // Merging succes
    await GU.selectRow(gridId, 2);
    await TU.locator(`[data-method="merge"]`).click();
    await TU.locator(`[data-reference="${referenceLocation}"]`).click();

    await TU.buttons.submit();
    await components.notification.hasSuccess();

    // Merging succes
    await GU.selectRow(gridId, 0);
    await GU.selectRow(gridId, 1);
    await TU.locator(`[data-method="merge"]`).click();
    await TU.locator(`[data-reference="${referenceLocation}"]`).click();

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });

  test('creates a new village', async () => {
    // switch to the create form
    await TU.buttons.create();

    await TU.select('ModalCtrl.village.country_uuid', village.country);
    await TU.select('ModalCtrl.village.province_uuid', village.province);
    await TU.select('ModalCtrl.village.sector_uuid', village.sector);
    await TU.input('ModalCtrl.village.name', village.name);

    // submit the page to the server
    await TU.buttons.submit();

    // expect a nice validation message
    await components.notification.hasSuccess();
  });

  test('edits a village', async () => {
    // click the edit button
    const menu = dropdownMenu(village.name);
    await menu.dropdown();
    await menu.edit();

    // update a country
    await TU.select('ModalCtrl.village.country_uuid', village.country);
    await TU.select('ModalCtrl.village.province_uuid', village.province);
    await TU.select('ModalCtrl.village.sector_uuid', village.sector);
    await TU.input('ModalCtrl.village.name', 'Village Update');

    await TU.buttons.submit();

    await components.notification.hasSuccess();
  });

  test('creates another village', async () => {

    // switch to the create form
    await TU.buttons.create();

    await TU.select('ModalCtrl.village.country_uuid', village2.country);
    await TU.select('ModalCtrl.village.province_uuid', village2.province);
    await TU.select('ModalCtrl.village.sector_uuid', village2.sector);
    await TU.input('ModalCtrl.village.name', village2.name);

    // submit the page to the server
    await TU.buttons.submit();

    // expect a nice validation message
    await components.notification.hasSuccess();
  });

  test('should delete the test village', async () => {
    // click the edit button
    const menu = dropdownMenu(village2.name);
    await menu.dropdown();
    await menu.remove();

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });

  test('correctly blocks invalid form submission with relevant error classes', async () => {

    // switch to the create form
    await TU.buttons.create();

    // verify form has not been submitted
    expect(await TU.getCurrentPath()).toBe(path);

    // submit the page to the server
    await TU.buttons.submit();

    // the following fields should be required
    await TU.validation.error('ModalCtrl.village.country_uuid');
    await TU.validation.error('ModalCtrl.village.province_uuid');
    await TU.validation.error('ModalCtrl.village.sector_uuid');
    await TU.validation.error('ModalCtrl.village.name');
    await TU.buttons.cancel();
  });

  /**
   *
   * @param label
   */
  function dropdownMenu(label) {
    return new GridRow(label);
  }
});
