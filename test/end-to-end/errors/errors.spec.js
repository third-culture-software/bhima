const { chromium } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const settings = '/#!/settings';

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
});

test.describe('Errors', () => {
  test.describe('404', Test404ErrorHandling);
  test.describe('403', Test403ErrorHandling);
});

/**
 *
 */
function Test404ErrorHandling() {
  const badPath = '/#!/incorrectPath';

  test('shows a 404 page when the path does exist', async () => {
    // Log in as superuser
    await TU.login();

    // Navigate to a bad path
    await TU.navigate(badPath);
    await TU.waitForSelector('[data-error="404"]');

    // make sure 404 exists
    await TU.exists('[data-error="404"]', true);

    // make sure URL is preserved
    expect(await TU.getCurrentPath()).toBe(badPath);

    // make sure we can navigate away
    await TU.navigate(settings);
    expect(await TU.getCurrentPath()).toBe(settings);

    await TU.logout();
  });

}

/**
 *
 */
function Test403ErrorHandling() {

  /**
   *
   * @param route
   */
  async function navigateToUnauthorizedRoute(route) {
    // Reset to a good path
    await TU.navigate(settings);

    // Navigate to the unauthorized path
    await TU.navigate(route);

    // Make sure it raises a 403 error
    await TU.waitForSelector('[data-error="403"]');
    await TU.exists('[data-error="403"]', true);
    expect(await TU.getCurrentPath()).toBe(route);
  }

  test('check Unauthorized Paths of the user RegularUser:', async () => {
    await TU.login('RegularUser', 'RegularUser');

    await navigateToUnauthorizedRoute('/#!/employees');

    await navigateToUnauthorizedRoute('/#!/debtors/groups');

    await navigateToUnauthorizedRoute('/#!/patients/register');

    await navigateToUnauthorizedRoute('/#!/cashboxes');

    await TU.logout();
  });

}
