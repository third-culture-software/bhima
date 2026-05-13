const TU = require('../TestUtils');
const { by } = require('../TestUtils');

const selector = '[bh-flux-select]';

module.exports = {

  /**
   * Select a set of fluxes
   * @param {Array} fluxes - array of fluxes to select
   * @param {*} [id] - flux input field (optional)
   */
  set : async function set(fluxes, id) {
    const locator = (id) ? by.id(id) : by.css(selector);
    const target = await TU.locator(locator);
    await target.click();

    return TU.series(fluxes, flux => TU.uiSelect('$ctrl.selectedFlux', flux));
  },
};
