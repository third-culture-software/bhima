const { chromium } = require('@playwright/test');
const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const GU = require('../shared/GridUtils');
const GridRow = require('../shared/GridRow');
const components = require('../shared/components');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('Countries Management', () => {
  const path = '/#!/locations/country';

  test.beforeEach(async () => {
    await TU.navigate(path);
  });

  const country = { name : 'New Country' };
  const country2 = {
    name : 'another country',
  };

  const gridId = 'country-grid';
  const referenceLocation = 'République Démocratique du Congo';

  test('Merge country', async () => {
    // Prevent mixing with no country selected
    await TU.locator(`[data-method="merge"]`).click();
    await components.notification.hasWarn();

    // Prevent mixing with less than two countries
    await GU.selectRow(gridId, 0);
    await TU.locator('[data-method="merge"]').click();
    await components.notification.hasWarn();

    // Merging success
    await GU.selectRow(gridId, 1);

    await TU.locator(`[data-method="merge"]`).click();
    await TU.locator(`[data-reference="${referenceLocation}"]`).click();

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });

  test('creates a new country', async () => {
    await TU.buttons.create();
    await components.inputText.set('name', country.name);
    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });

  test('edits a country', async () => {
    const menu = dropdownMenu(country.name);
    await menu.dropdown();
    await menu.edit();

    // modify the country name
    await components.inputText.set('name', 'Country Update');

    // submit the page to the server
    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });

  test('creates another country', async () => {

    // switch to the create form
    await TU.buttons.create();

    await components.inputText.set('name', country2.name);
    // submit the page to the server
    await TU.buttons.submit();
    // expect a nice validation message
    await components.notification.hasSuccess();
  });

  test('should delete the test country', async () => {
    const menu = dropdownMenu(country2.name);
    await menu.dropdown();
    await menu.remove();

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  });

  test('blocks invalid form submission with relevant error classes', async () => {
    // switch to the create form
    await TU.buttons.create();

    // submit the page to the server
    await TU.buttons.submit();
    // the following fields should be required
    await components.inputText.validationError('name');
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
