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

test.describe('Sectors Management', () => {
  const path = '/#!/locations/sector';

  test.beforeEach(async () => {
    await TU.navigate(path);
  });

  const sector = {
    country : 'République Démocratique du Congo',
    province : 'Kinshasa',
    name : 'New Sector',
  };

  const sector2 = sector;
  sector2.name = 'test-sector';

  const gridId = 'sector-grid';
  const referenceLocation = 'Lukunga';

  test('Merge Sector', async () => {
    // Prevent mixing with no country selected
    await TU.locator(`[data-method="merge"]`).click();
    await components.notification.hasWarn();

    // Prevent mixing with less than two sectors
    await GU.selectRow(gridId, 0);
    await TU.locator(`[data-method="merge"]`).click();
    await components.notification.hasWarn();

    // Prevent mixing with more than two sectors
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

  test('creates a new sector', async () => {
    // switch to the create form
    await TU.buttons.create();

    // select an country
    await TU.select('ModalCtrl.sector.country_uuid', sector.country);
    await TU.select('ModalCtrl.sector.province_uuid', sector.province);
    await TU.input('ModalCtrl.sector.name', sector.name);

    // submit the page to the server
    await TU.buttons.submit();

    await components.notification.hasSuccess();
  });

  test('edits a sector', async () => {
    const menu = await dropdownMenu(sector.name);
    await menu.dropdown();
    await menu.edit();

    await TU.select('ModalCtrl.sector.country_uuid', sector.country);
    await TU.select('ModalCtrl.sector.province_uuid', sector.province);
    await TU.input('ModalCtrl.sector.name', 'Sector Update');

    // submit the page to the server
    await TU.buttons.submit();

    // make sure the success message appears
    await components.notification.hasSuccess();
  });

  test('creates another sector', async () => {

    // switch to the create form
    await TU.buttons.create();

    await TU.select('ModalCtrl.sector.country_uuid', sector2.country);
    await TU.select('ModalCtrl.sector.province_uuid', sector2.province);
    await TU.input('ModalCtrl.sector.name', sector2.name);

    // submit the page to the server
    await TU.buttons.submit();

    // expect a nice validation message
    await components.notification.hasSuccess();
  });

  test('should delete the test sector', async () => {
    // click the edit button
    const menu = await dropdownMenu(sector.name);
    await menu.dropdown();
    await menu.remove();

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });

  test('blocks invalid form submission with relevant error classes', async () => {
    // switch to the create form
    await TU.buttons.create();

    // Verify form has not been successfully submitted
    expect(TU.getCurrentPath()).toBe(path);

    // submit the page to the server
    await TU.buttons.submit();

    // the following fields should be required
    await TU.validation.error('ModalCtrl.sector.country_uuid');
    await TU.validation.error('ModalCtrl.sector.province_uuid');
    await TU.validation.error('ModalCtrl.sector.name');
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
