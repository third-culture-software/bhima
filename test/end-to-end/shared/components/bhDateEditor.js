const TU = require('../TestUtils');
const { by } = require('../TestUtils');

/**
 * Date editor component interface for e2e test
 */

const selector = '[data-date-editor]';

module.exports = {

  // root level css selector for this component

  /**
   * Sets the date input's value to the passed in value
   * @param {Date} date - a date object to set
   * @param {string} id - a CSS id to select on.
   * @param {string} elementClick - determine a css class that will clicked to
   * close the selection component Dates.
   * @returns {Promise} for closing the dialog after setting the date
   */
  set : async function set(date, id, elementClick) {
    const elementCloseComponent = elementClick || '.header-image';

    // fail hard if the user did not provide a Date object
    if (!(date instanceof Date)) {
      throw new TypeError('You  must provide a date object to the set() method.');
    }

    // find the component in the DOM by its selector
    const root = await TU.locator((id) ? by.id(id) : by.css(selector));

    // get the dropdown toggle and click it.
    const btn = await root.locator(by.css('[data-date-editor-dropdown-toggle]'));
    await btn.click();

    const input = await root.locator(by.css('[data-date-editor-input]'));
    await input.clear();

    // format the date appropriately.
    const year = date.getFullYear();

    const _month = String(date.getMonth() + 1);
    const month = (_month.length < 2) ? `0${_month}` : _month;

    const _day = String(date.getDate());
    const day = (_day.length < 2) ? `0${_day}` : _day;

    // set the date on the input
    await input.type([day, month, year].join('/'));

    // at this point, the datepicker is still open, and will intercept all
    // clicks that are made to any elements it is covering.  In order to make
    // the dropdown go away, we will click on the top-left bhima logo to blur
    // in default option, If not, the click will be on an element of the form,
    // if and only if the logo is not visible, for example for the modal window
    // the dropdown and remove it.
    const closer = await TU.locator(by.css(elementCloseComponent));
    return closer.click();
  },
};
