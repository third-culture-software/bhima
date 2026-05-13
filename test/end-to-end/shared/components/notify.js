const { expect } = require('@playwright/test');
const playwright = require('@playwright/test');
const TU = require('../TestUtils');

const defaultTimeout = 8000; // Long enough for testing

module.exports = {

  /**
   * Wait for a success notice
   * @param {object} opts - options for waitForSelector
   * @returns {Promise} for the dismissing the notice
   */
  hasSuccess : async function hasSuccess(opts) {
    let success = false;
    try {
      const options = opts || { timeout : defaultTimeout };
      await TU.waitForSelector('[data-notification-type="notification-success"]', options);
      success = true;
    } catch (error) {
      if (error instanceof playwright.errors.TimeoutError) {
        // pass
      } else {
        throw error;
      }
    }
    expect(success, 'Expected a success notification, but could not find one.').toBe(true);
    return dismiss();
  },

  /**
   * Wait for a warning notice
   * @param {object} opts - options for waitForSelector
   * @returns {Promise} for the dismissing the notice
   */
  hasWarn : async function hasWarn(opts) {
    let success = false;
    try {
      const options = opts || { timeout : defaultTimeout };
      await TU.waitForSelector('[data-notification-type="notification-warn"]', options);
      success = true;
    } catch (error) {
      if (error instanceof playwright.errors.TimeoutError) {
        // pass
      } else {
        throw error;
      }
    }
    expect(success, 'Expected a warning notification, but could not find one.').toBe(true);
    return dismiss();
  },

  /**
   * Wait for an info notice
   * @param {object} opts - options for waitForSelector
   * @returns {Promise} for the dismissing the notice
   */
  hasInfo : async function hasInfo(opts) {
    let success = false;
    try {
      const options = opts || { timeout : defaultTimeout };
      await TU.waitForSelector('[data-notification-type="notification-info"]', options);
      success = true;
    } catch (error) {
      if (error instanceof playwright.errors.TimeoutError) {
        // pass
      } else {
        throw error;
      }
    }
    expect(success, 'Expected an informational notification, but could not find one.').toBe(true);
    return dismiss();
  },

  /**
   * Wait for a danger notice
   * @param {object} opts - options for waitForSelector
   * @returns {Promise} for the dismissing the notice
   */
  hasDanger : async function hasDanger(opts) {
    let success = false;
    try {
      const options = opts || { timeout : defaultTimeout };
      await TU.waitForSelector('[data-notification-type="notification-danger"]', options);
      success = true;
    } catch (error) {
      if (error instanceof playwright.errors.TimeoutError) {
        // pass
      } else {
        throw error;
      }
    }
    expect(success, 'Expected a danger notification, but could not find one.').toBe(true);
    return dismiss();
  },

  /**
   * Wait for an error notice
   * @param {object} opts - options for waitForSelector
   * @returns {Promise} for the dismissing the notice
   */
  hasError : async function hasError(opts) {
    let success = false;
    try {
      const options = opts || { timeout : defaultTimeout };
      await TU.waitForSelector('[data-notification-type="notification-error"]', options);
      success = true;
    } catch (error) {
      if (error instanceof playwright.errors.TimeoutError) {
        // pass
      } else {
        throw error;
      }
    }
    expect(success, 'Expected an error notification, but could not find one.').toBe(true);
    return dismiss();
  },

  dismiss,
};

/**
 * Dismiss the notice
 * @returns {Promise} for the dismissal
 */
async function dismiss() {
  return (await TU.locator('[data-dismiss="notification"]')).click();
}
