const { chromium } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');

// routes used in tests
const settings = 'settings';

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('Settings', () => {

  test.beforeEach(async () => {
    await TU.navigate(settings);
  });

  test('loads the page, and selects a language', async () => {
    // confirm that we can change the languages (to French)
    const selector = await TU.locator('#select-language');
    await selector.selectOption('string:fr');
    const label = await TU.locator('label[for="select-language"]').innerText();
    expect(label).toBe('Langue');
  });

  test('uses the back button to return to previous state', async () => {
    const start = '/#!/';

    // load the settings page w/o backwards navigation
    await TU.navigate(start);
    await TU.navigate('settings');
    expect(TU.getCurrentPath()).toBe('/#!/settings');

    // Ensure we can navigate back to the main page with the back button.

    // click the back button
    await TU.locator('[data-back-button]').click();

    // ensure we navigate back to the main page.
    expect(TU.getCurrentPath()).toBe(start);
  });

});
