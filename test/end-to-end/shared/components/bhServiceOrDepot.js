const TU = require('../TestUtils');
const { by } = require('../TestUtils');

const bhService = require('./bhServiceSelect');
const bhDepot = require('./bhDepotSelect');

const selector = '[bh-service-or-depot-select]';

module.exports = {

  /**
   * select a service or depot
   * @param {string} requestor - the requester
   * @param {string} type - the type (service or depot)
   * @param {string} [id] - id of selection field (optional)
   * @returns {Promise} of the completed operation
   */
  set : async function set(requestor, type = 'service', id = undefined) {
    const map = {
      service : bhService,
      depot : bhDepot,
    };

    // Make sure the form is displayed
    await TU.waitForSelector('form[name="ModalForm"]');

    // Select the desired target
    const locator = (id) ? by.id(id) : selector;
    const target = await TU.locator(locator);
    const option = await target.locator(`[data-requestor-option="${type}"]`);
    await option.click();

    // Set it
    return map[type].set(requestor, id, selector);
  },
};
