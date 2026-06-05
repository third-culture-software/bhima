const TU = require('../shared/TestUtils');
const components = require('../shared/components');
const GridRow = require('../shared/GridRow');

/**
 * This class is represents a depot page in term of structure and
 * behaviour so it is a depot page object.
 */

class DepotPage {
  constructor() {
    this.gridId = 'depot-grid';
    // this.depotGrid = element(by.id(this.gridId));
  }

  async init() {
    this.depotGrid = await TU.locator(`#${this.gridId}`);
  }

  /**
   * simulate the create depot button click to show the dialog of creation
   * @param {string} name - the name of the depot
   * @param {boolean} hasWarehouse - flag
   * @param {boolean} hasLocation - if true it will enable the option of adding location ("join location")
   * @param {Array} location - an array of location as [country_uuid, province_uuid, sector_uuid, village_uuid]
   * @param {number} defaultPurchaseInterval - new value
   */
  async createDepot(name, hasWarehouse, hasLocation, location, defaultPurchaseInterval) {
    await TU.buttons.create();
    await TU.input('DepotModalCtrl.depot.text', name);
    await TU.input('DepotModalCtrl.depot.default_purchase_interval', defaultPurchaseInterval);

    if (hasWarehouse) {
      await TU.locator('[name="is_warehouse"]').click();
    }

    if (hasLocation) {
      await TU.locator('[name="has_location"]').click();
      await components.locationSelect.set(location);
    }

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * simulate the create depot button click to show the dialog of creation
   * @param {string} item - the name of the depot to create and parent {depot and parent}
   * @param {boolean} hasLocation - if true it will enable the option of adding location
   * @param {Array} location - an array of location as [country_uuid, province_uuid, sector_uuid, village_uuid]
   */
  async createDepotByParent(item, hasLocation, location) {
    const row = new GridRow(item.parent);
    await row.dropdown();

    const findul = `ul.dropdown-menu-right.dropdown-menu[data-row-menu="${item.parent}"]`;
    await TU.locator(`${findul} a[data-method="add-dependant-depot"]`).click();

    await TU.input('DepotModalCtrl.depot.text', item.text);
    await TU.input('DepotModalCtrl.depot.default_purchase_interval', item.default_purchase_interval);

    if (hasLocation) {
      await TU.locator('[name="has_location"]').click();
      await components.locationSelect.set(location);
    }

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * block creation without the depot name
   */
  async errorOnCreateDepot() {
    await TU.buttons.create();
    await TU.buttons.submit();
    await TU.validation.error('DepotModalCtrl.depot.text');
    await TU.buttons.cancel();
  }

  /**
   * simulate a click on the edit link of a depot
   * @param {string} text - name of the depot to edit
   * @param {string} newDepotText - new name of the depot
   * @param {number} defaultPurchaseInterval - new value
   */
  async editDepot(text, newDepotText, defaultPurchaseInterval) {
    const row = new GridRow(text);
    await row.dropdown();
    await row.edit();

    await TU.input('DepotModalCtrl.depot.text', newDepotText);
    await TU.input('DepotModalCtrl.depot.default_purchase_interval', defaultPurchaseInterval);

    // entry/exit permissions
    await TU.locator('[name="allow_entry_purchase"]').click();
    await TU.locator('[name="allow_entry_integration"]').click();
    await TU.locator('[name="allow_entry_donation"]').click();
    await TU.locator('[name="allow_entry_transfer"]').click();
    await TU.locator('[name="allow_exit_debtor"]').click();
    await TU.locator('[name="allow_exit_service"]').click();
    await TU.locator('[name="allow_exit_transfer"]').click();
    await TU.locator('[name="allow_exit_loss"]').click();

    await TU.modal.submit();
    await components.notification.hasSuccess();
  }

  /**
   * simulate a click on the edit link of a depot
   * @param {string} text - remove the parent of the depot with name 'text'
   */
  async editDepotClearParent(text) {
    const row = new GridRow(text);
    await row.dropdown();
    await row.edit();

    await TU.locator('[class="fa fa-eraser"]').click();

    await TU.modal.submit();
    await components.notification.hasSuccess();
  }

  /**
   * join a location to a depot
   * @param depotName
   * @param locations
   */
  async joinLocation(depotName, locations) {
    const row = new GridRow(depotName);
    await row.dropdown();
    await row.edit();

    // Make sure the edit form has a legal value for default purchase interval
    const dpintField = await TU.locator('[ng-model="DepotModalCtrl.depot.default_purchase_interval"]');
    const dpint = await dpintField.inputValue();
    if (dpint === '0') {
      await TU.input('DepotModalCtrl.depot.default_purchase_interval', 1);
    }

    await TU.locator('[name="has_location"]').click();

    await components.locationSelect.set(locations);

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * join a location to a depot
   * @param item
   */
  async joinParent(item) {
    const row = new GridRow(item.depot);
    await row.dropdown();
    await row.edit();

    await components.depotSelect.set(item.parent);

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * remove a location to a depot
   * @param depotName
   */
  async removeLocation(depotName) {
    const row = new GridRow(depotName);
    await row.dropdown();
    await row.edit();

    await TU.locator('[name="has_location"]').click();

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  /**
   * simulate a click on the delete link of a depot
   * @param text
   */
  async deleteDepot(text) {
    const row = new GridRow(text);
    await row.dropdown();
    await row.remove();

    await components.modalAction.confirm();
    await components.notification.hasSuccess();
  }

  /**
   * select the User Depots
   * @param depots
   */
  async selectUserDepot(depots) {
    await components.multipleDepotSelect.set(depots);
  }

  /**
   * Submit button User Depot
   */
  async submitUserDepot() {
    await components.notification.hasSuccess();
  }

  async selectDepot(name, id) {
    await components.bhMultipleDepotSearchSelect.set(name, id);
    await TU.buttons.submit();
  }
}

module.exports = DepotPage;
