/**
 * Utilities for Playwright End-to-End testing
 */

const { expect } = require('@playwright/test');

const PATH_CLEAN_REGEXP = /^[#!/]+/g;

/**
 * Remember the page being used to simplify function calls
 */
let page;

/**
 * These buttons depend on custom data tags to indicate actions.
 * This seems cleaner than using a whole bunch of ids which may
 * potentially collide.
 */
const buttons = {
  create    : () => page.locator('[data-method="create"]').click(),
  search    : () => page.locator('[data-method="search"]').click(),
  submit    : () => page.locator('[data-method="submit"]').click(),
  cancel    : () => page.locator('[data-method="cancel"]').click(),
  close     : () => page.locator('[data-method="close"]').click(),
  edit      : () => page.locator('[data-method="edit"]').click(),
  clear     : () => page.locator('[data-method="clear"]').click(),
  print     : () => page.locator('[data-method="print"]').click(),
  back      : () => page.locator('[data-method="back"]').click(),
  reset     : () => page.locator('[data-method="reset"]').click(),
  delete    : () => page.locator('[data-method="delete"]').click(),
  configure : () => page.locator('[data-method="configure"]').click(),
  add       : () => page.locator('[data-method="add"]').click(),
  save      : () => page.locator('[data-method="save"]').click(),
  grouping  : () => page.locator('[data-method="grouping"]').click(),
};

// This methods are for easily working with modals.  Works with the same custom
// data tags used in form buttons.
const modal = {
  submit : function submit() {
    return page.locator('[uib-modal-window] [data-method="submit"]').click();
  },
  cancel : function cancel() {
    return page.locator('[uib-modal-window] [data-method="cancel"]').click();
  },
  close : function close() {
    return page.locator('[uib-modal-window] [data-method="close"]').click();
  },
  print : function print() {
    return page.locator('[uib-modal-window] [data-method="print"]').click();
  },
};

/**
 * Convenience function for 'by' functions
 */
const by = {
  css : (arg) => arg,
  id : (arg) => `#${arg}`,
  className : (arg) => `.${arg}`,
  model : (arg) => `[ng-model="${arg}"]`,
  name : (arg) => `[name="${arg}"]`,
  repeater : (arg) => `[ng-repeat="${arg}"]`,

  containsText : (arg) => `//*[contains(text(), '${arg}')]`,
  hasText : (arg) => `[text="${arg}"]`,
  linkText : (arg) => `a[text="${arg}"]`,
  linkContainsText : (arg) => `//a[contains(text(), '${arg}')]`,
};

// convenience methods to check form element validation states
const validation = {

  // an error state is present
  error : async function error(model) {
    const modelElt = await page.locator(`[ng-model="${model}"]`);
    const eltClass = await modelElt.getAttribute('class');
    expect(eltClass.includes('ng-invalid'),
      `Expected ${model} to be invalid, but could not find the ng-invalid class.`);
  },

  // no error state present
  ok : async function success(model) {
    const modelElt = await page.locator(`[ng-model="${model}"]`);
    const eltClass = await modelElt.getAttribute('class');
    expect(eltClass.includes('ng-valid'),
      `Expected ${model} to be valid, but could not find the ng-valid class.`);
  },
};

/**
 * Fill an input field
 * @param {object} field - the field to fill
 * @param {string} value - string or number value to fill the field with
 * @returns {Promise} of completed fill operation
 */
async function fill(field, value) {
  return field.fill(typeof value === 'number' ? value.toString() : value);
}

/**
 * Fill an <input> element for a model
 * @param {string} model - name/selector of the ng-model for the input field
 * @param {string} value - value to fill into the input field
 * @param {any} [anchor] - optional selector (or locator object) for the parent/anchor for the input field
 * @returns {Promise} for the fill operation
 */
async function input(model, value, anchor) {
  if (typeof page === 'undefined') {
    throw new Error('Must call registerPage() first!');
  }
  const selector = (anchor && typeof anchor === 'string')
    ? `${anchor} [ng-model="${model}"]`
    : `[ng-model="${model}"]`;
  const field = (anchor && typeof anchor !== 'string')
    ? await anchor.locator(selector)
    : await page.locator(selector);

  // Playwright has problems with input fields with type=number
  return field.fill(typeof value === 'number' ? value.toString() : value);
}

/**
 * Get the specified model element
 * @param {string} modelName - name/id of the model
 * @param {string} [anchor] - optional selector/locator for the anchor element (defaults to page)
 * @returns {Promise} promise for the desired model element
 */
function getModel(modelName, anchor) {
  if (typeof page === 'undefined') {
    throw new Error('Must call registerPage() first!');
  }
  if (typeof anchor === 'string') {
    return page.locator(`${anchor} [ng-model="${modelName}"]`);
  }
  if (anchor) {
    return anchor.locator(`[ng-model="${modelName}"]`);
  }
  return page.locator(`[ng-model="${modelName}"]`);
}

/**
 * Selects an option from an <select> html element
 * @param {*} selector - Selector for the select field (must produce unique element)
 * @param {*} value - the option to select (with value="<value>")
 * @returns {Promise} of the result of the selection action
 */
function selectOption(selector, value) {
  return page.locator(selector).selectOption(value);
}

/**
 * Request navigation to a desired browser page
 * @param {string} browserPath - the path desired (the part after the baseUrl)
 * @param {object} [options] - associative array of options (optional)
 * @returns {Promise} of navigation to the desired path
 */
function navigate(browserPath, options) {
  const destination = browserPath.replace(PATH_CLEAN_REGEXP, '');
  return page.goto(`/#!/${destination}`, options);
}

// Expose function routes
module.exports = {

  /**
   * registerPage - Save the page object for the functions in this module
   *
   * Note: NOT async (not necessary to 'await' for this function)
   * @param {object} newPage - Playwright test browser test page
   */
  registerPage : function registerPage(newPage) {
    page = newPage;
  },

  /**
   * get the browser path (after the baseUrl)
   *
   * Note: NOT async (not necessary to 'await' for this function)
   * @returns {string} the normalized current path
   */
  getCurrentPath : function getCurrentPath() {
    const url = page.url();
    const partial = url.split('#!/')[1];
    partial.replace(PATH_CLEAN_REGEXP, '');
    return `/#!/${partial}`;
  },

  /**
   * Clean up the prefix from the path
   * @param {string} oldPath - the unfiltered path
   * @returns {string} path withough leading '/#!/' prefix
   */
  cleanPath : function cleanPath(oldPath) {
    return oldPath.replace(PATH_CLEAN_REGEXP, '');
  },

  /**
   * Check to see an element exists (or not) on the page
   * @param {string} selector - the selector to check
   * @param {boolean} bool - whether it should exist or not (default: true)
   * @returns {Promise} for the result of the assertion
   */
  exists : async function exists(selector, bool = true) {
    const count = await page.locator(selector).count();
    return expect(count > 0,
      `Expected locator ${selector} to ${bool ? '' : 'not '}exist.`,
    ).toBe(bool);
  },

  /**
   * get an element by its role (eg, 'heading' for 'h*')
   * @param {string} role - the role to get
   * @param {string} name - name of object with that role (optional)
   * @returns {Promise} for the element
   */
  getByRole : function getByRole(role, name) {
    if (name) {
      return page.getByRole(role, { name });
    }
    return page.getByRole(role, name);
  },

  /**
   * See if the specified selector has the expected text
   * @param {string} selector - selector for the element that should contain the text
   * @param {string} expectedText - the expected text
   * @returns {boolean} success/failure
   */
  hasText : async function hasText(selector, expectedText) {
    const text = await page.locator(selector).innerText();
    return expect(text).toBe(expectedText);
  },

  /**
   * Return true if the selector is present on the current page
   * @param {string} selector - the selector to check
   * @returns {boolean} result
   */
  isPresent : async function isPresent(selector) {
    const count = await page.locator(selector).count();
    return count > 0;
  },

  /**
   * Get the desired locator.
   *
   * Convenience function for modules that do not have direct access to the page object.
   * @param {string} selector - selector for the desired element
   * @returns {Promise} for the locator
   */
  locator : function locator(selector) {
    if (typeof page === 'undefined') {
      throw new Error('Must call registerPage() first!');
    }
    return page.locator(selector);
  },

  /**
   * Log into the BHIMA server
   * @param {string} username - username to log in (optional)
   * @param {string} password - password to log in (optional)
   * @returns {Promise} promise to return the main page after logging in
   */
  login : async function login(username, password) {
    if (typeof page === 'undefined') {
      throw new Error('Must call registerPage() first!');
    }

    // Go to the login page
    await page.goto('/#!/login');
    expect(page).toHaveTitle(/BHIMA/);

    // First, switch to English

    // (expose the language drop-down menu)
    await page.locator('div.panel-heading > div.dropdown > a').click();

    // (click on the English option)
    await page.locator('div.panel-heading > div.dropdown a[lang="en"]').click();

    // (verify it is now English)
    await page.waitForSelector('.panel-heading');
    expect(await page.locator('.panel-heading').innerText()).toBe('Login');

    // Log in
    await input('LoginCtrl.credentials.username', username || 'superuser');
    await input('LoginCtrl.credentials.password', password || 'superuser');
    await buttons.submit();

    return page.waitForURL('**/#!/');
  },

  /**
   * Log out of the BHIMA server
   * @returns {Promise} promise to return the login page after logging out
   */
  logout : async function logout() {
    if (typeof page === 'undefined') {
      throw new Error('Must call registerPage() first!');
    }

    // If we are already logged out, don't log out again
    const url = page.url();
    if (url === 'about:blank' || url.endsWith('/login')) {
      return url;
    }

    // Go to the Settings page to log out
    await page.goto('/#!/settings');
    await page.waitForURL('**/settings');

    // log out
    await page.locator('button[data-logout-button]').click();

    return page.waitForURL('**/login');
  },

  /**
   * Reload the page
   * @param {object} options - Options for page.reload
   * @returns {Promise} for reloaded page
   */
  reloadPage : function reloadPage(options) {
    if (typeof page === 'undefined') {
      throw new Error('Must call registerPage() first!');
    }
    return page.reload(options);
  },

  /**
   * get a radio button by its position and click
   * @param {string} model - model for radio element
   * @param {number} n - which one to click on
   * @returns {Promise} for clicking on nth radio button
   */
  radio : function radio(model, n) {
    return page.locator(`[ng-model="${model}"]`).nth(n).click();
  },

  /**
   * Selects a dropdown option from a typeahead html element.  Accepts the model
   * selector, the option label, and an optional anchor element to search within.
   * If no anchor is provided, it defaults to the body.
   * @param {string} model - the ng-model target to select
   * @param {string} label - the text of the option element to choose
   * @param {Element} anchor_ - an element to search within
   * @returns {Promise} - an option element
   */
  typeahead : async function typeahead(model, label, anchor_) {
    const anchor = anchor_ || await page.locator('body');

    // type into the <input> element
    await this.input(model, label, anchor);

    // select the item of the dropdown menu matching the label
    return anchor.locator(`.dropdown-menu > [role="option"] >> text="${label}"`).click();
  },

  /**
   * Selects an option from an <select> html element.  Accepts the model
   * selector, the option text, and an optional anchor element to search within.
   * If no anchor is provided, it defaults to the body.
   * @param {string} modelName - the ng-model target to select
   * @param {string} option - the text of the <option> element to choose
   * @param {Element} anchor - an element to search within
   * @returns {Element} - an <option> element
   */
  select : async function select(modelName, option, anchor) {
    const model = `[ng-model="${modelName}"]`;
    const optionSelect = (anchor) ? await anchor.locator(model) : await page.locator(model);
    return optionSelect.selectOption(option);
  },

  /**
   * Selects an option from the ui-select dropdown
   * @function uiSelect
   * @param {string} model - the ng-model target to select
   * @param {string} label - the text of the option element to choose
   * @param {Element} anchor - an element to search within
   * @param {boolean} isMultipleSelection - flag
   * @param {string} searchType - contains|exact|fullWord|accountName
   * @returns {Element} - an option element
   */
  uiSelect : async function uiSelect(
    model, label, anchor, isMultipleSelection, searchType = 'contains',
  ) {
    if (typeof page === 'undefined') {
      throw new Error('Must call registerPage() first!');
    }

    // get the HTML <div> element that will trigger the select input
    const select = await getModel(model, anchor);

    // trigger the <input> rendering
    await select.click();

    // type into the <input> element the searchable value
    // only for multiple selection
    if (isMultipleSelection) {
      return select.locator('a').locator(by.containsText(label)).click();
    }

    // select the item of the dropdown menu matching the label
    let searchString = label;
    let labelForRegex = label.replace('(', '\\(');
    labelForRegex = labelForRegex.replace(')', '\\)');

    switch (searchType) {
    case 'exact':
      // WARNING: Treating 'exact' as a 'fullWord' search.
      // @TODO : Fix this and 'accountName' later when we can get playwright :text-matches()
      // pseudo selector working with regexes
      // See https://playwright.dev/docs/other-locators#css-matching-by-text
      return select.locator('.dropdown-menu [role="option"]').locator(`//*[text()='${searchString}']`).click();
    case 'fullWord':
      // Search for whole string
      return select.locator('.dropdown-menu [role="option"]').locator(`//*[text()='${searchString}']`).click();
    case 'accountName':
      console.debug(`WARNING: 'accountName' regex search is broken`);  
      // Try to fix it with https://playwright.dev/docs/other-locators#css-matching-by-text
      searchString = new RegExp(`\\d+\\s+${labelForRegex}\\s+`);
      break;
    case 'contains':
    default:
      searchString = label;
      break;
    }

    return select.locator('.dropdown-menu [role="option"]').locator(`//*[contains(text(), "${searchString}")]`).click();
  },

  /**
   * Selects a dropdown option from a dropdown html element.  Accepts the target
   * selector, the option text, and an optional anchor element to search within.
   * If no anchor is provided, it defaults to the body.
   * @param {string} selector - the css selector to select
   * @param {string} label - the text of the option element to choose
   * @param {object} anchor - an element to search within
   * @returns {object} - an option element
   */
  dropdown : async function dropdown(selector, label, anchor) {
    const node = anchor || page.locator('body');

    // open the dropdown menu
    await page.locator(selector).click();

    // Select the desired option
    const option = await node.locator('[uib-dropdown-menu] > li')
      .locator(by.containsText(label));
    return option.click();
  },

  /**
   * Upload a file using a specific file input field
   * @param {string} filePath - the absolute path for the file to upload
   * @param {string} selector - selector for the <input type="file"> field to use
   * @returns {Promise} for the uploading
   */
  uploadFile : function uploadFile(filePath, selector) {
    return page.locator(selector).setInputFiles(filePath);
  },

  /**
   * Wait for the specified selector
   * @param {string} selector - The selector to wait for
   * @param {Array} [options] - the options to use (optional)
   * @returns {Promise} - promise for the request
   */
  waitForSelector : function waitForSelector(selector, options = undefined) {
    return page.waitForSelector(selector, options);
  },

  waitForLoadState : function waitForLoadState(state, options) {
    return page.waitForLoadState(state, options);
  },

  waitForTimeout : function waitForTimeout(timeout) {
    return page.waitForTimeout(timeout);
  },

  /**
   * Wait for the page to navigate to the given URL
   *
   * For more info on the options, see
   * https://playwright.dev/docs/api/class-page#page-wait-for-url
   * @param {string} url - The URL to wait for
   * @param {Array} [options] - the options to use (optional)
   * @returns {Promise} for waiting for the url
   */
  waitForURL : function waitForURL(url, options = undefined) {
    return page.waitForURL(url, options);
  },

  /**
   * chains an array of promises and runs them in series.
   * @param {Array} items - an array of items
   * @param {Function} callback - the callback function
   * @returns {Promise} for resolution of the last promise
   */
  series : async (items, callback) => {
    return items.reduce(
      (promise, item, index, array) => promise.then(() => callback(item, index, array)),
      Promise.resolve(),
    );
  },

  /**
   * Do a screen shot
   * @param {string} path - name/path of the screen shot file
   * @returns {Promise} for completion of the screen shot
   */
  screenshot : async (path) => {
    return page.screenshot({ path });
  },

  buttons,
  by,
  fill,
  getModel,
  input,
  modal,
  navigate,
  selectOption,
  validation,
};

// console.debug('Page: ', Object.getOwnPropertyNames(page));
// console.table(Object.getOwnPropertyNames(Object.getPrototypeOf(page)).sort());

// console.time('Timer name');
// <CMDS>
// console.timeEnd('Timer name');
