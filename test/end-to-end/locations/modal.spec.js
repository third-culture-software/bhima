const { chromium } = require('@playwright/test');
const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const notification = require('../shared/components/notify');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('Locations (in create patient modal)', () => {
  const path = '#!/patients/register';

  test.beforeEach(async () => {
    await TU.navigate(path);
  });

  const newLocation = {
    country  : 'Test Country 2',
    province : 'Test Province 2',
    sector   : 'Test Sector 2',
    village  : 'Test Village 2',
  };

  const selector = '#origin-location-id';

  /**
   * open the modal
   * @returns {Promise} of the button click
   */
  function open() {
    return TU.locator(`${selector} [data-location-modal-open]`).click();
  }

  /**
   * switch to a certain view on the modal
   * @param {string} key - which view (tab) open
   * @returns {Promise} of the button click
   */
  function view(key) {
    // Click on the correct tab button
    return TU.locator(`[data-location-view-key=${key}]`).click();
  }

  /**
   * Submit the modal
   * @returns {Promise} of the button click
   */
  function submit() {
    return TU.locator(`form[name=LocationModalForm] [type=submit]`).click();
  }

  test('registers a new country', async () => {
    await open();

    // switch to the country view
    await view('country');

    // create a new country entity
    await TU.input('LocationModalCtrl.country', newLocation.country);

    // submit the country
    await submit();
    await notification.hasSuccess();

    // it should close the modal
    await TU.exists('[data-location-modal]', false);
  });

  test('registers a new province', async () => {
    await open();

    // switch to the province view
    await view('province');

    // get the country select and select the previous country
    await TU.select('LocationModalCtrl.country', newLocation.country);
    await TU.input('LocationModalCtrl.province', newLocation.province);

    // submit the modal
    await submit();
    await notification.hasSuccess();

    // it should close the modal
    await TU.exists('[data-location-modal]', false);
  });

  test('register a new sector', async () => {
    await open();

    // switch to the sector view
    await view('sector');

    await TU.select('LocationModalCtrl.country', newLocation.country);
    await TU.select('LocationModalCtrl.province', newLocation.province);
    await TU.input('LocationModalCtrl.sector', newLocation.sector);

    // submit the modal
    await submit();
    await notification.hasSuccess();

    // it should close the modal
    await TU.exists('[data-location-modal]', false);
  });

  test('register a new village', async () => {
    await open();

    // switch to the village view
    await view('village');

    await TU.select('LocationModalCtrl.country', newLocation.country);
    await TU.select('LocationModalCtrl.province', newLocation.province);
    await TU.select('LocationModalCtrl.sector', newLocation.sector);
    await TU.input('LocationModalCtrl.village', newLocation.village);

    // submit the modal
    await submit();
    await notification.hasSuccess();

    // it should close the modal
    await TU.exists('[data-location-modal]', false);
  });

});
