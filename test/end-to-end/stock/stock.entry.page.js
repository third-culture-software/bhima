const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

/* eslint no-await-in-loop:off */

const GU = require('../shared/GridUtils');
const components = require('../shared/components');

const SharedStockPage = require('./stock.shared.page');

/**
 *
 */
function StockEntryPage() {
  const page = this;

  const gridId = 'stock-entry-grid';
  const lotGridId = 'LotsGrid';

  // the grid id
  page.gridId = gridId;
  page.setDepot = SharedStockPage.setDepot;

  /**
   * @function setPurchase
   * @param {string} rowNumber - the purchase line on the modal
   */
  page.setPurchase = async function setPurchase(rowNumber) {
    await components.stockEntryExitType.set('purchase');
    await GU.selectRow('PurchaseGrid', rowNumber);
    await TU.modal.submit();
  };

  /**
   * @function setTransfer
   * @param {string} rowNumber - movement line on the modal grid
   */
  page.setTransfer = async function setTransfer(rowNumber) {
    await components.stockEntryExitType.set('transfer_reception');
    await GU.selectRow('TransferGrid', rowNumber);
    await TU.modal.submit();
  };

  /**
   * @function setIntegration
   */
  page.setIntegration = async function setIntegration() {
    await components.stockEntryExitType.set('integration');
  };

  /**
   * @function setDescription
   * @param {string} descrition - the entry description
   * @param description
   */
  page.setDescription = async function setDescription(description) {
    await TU.input('StockCtrl.movement.description', description);
  };

  /**
   * @function setDate
   * @param {string} date - the entry date
   */
  page.setDate = async function setDate(date) {
    await components.dateEditor.set(date);
  };

  /**
   * @param n
   * @function addRows
   */
  page.addRows = async function addRows(n) {
    await components.addItem.set(n);
  };

  /**
   * @param rowNumber
   * @param code
   * @function setItem
   */
  page.setItem = async function setInventory(rowNumber, code) {
    // inventory code column
    const itemCell = await GU.getCell(gridId, rowNumber, 1);

    // enter data into the typeahead input.
    await TU.input('row.entity.inventory_uuid', code, itemCell);

    const externalAnchor = await TU.locator('body > ul.dropdown-menu.ng-isolate-scope:not(.ng-hide)');
    const option = await externalAnchor.locator('[role="option"]').locator(by.containsText(code));
    await option.click();
  };

  /**
   * @function setLots
   * @param {number} inventoryRowNumber - the number of the row of the inventory
   * @param {Array} lotsArray - An array of lots
   * @param isTransferReception
   * @param inventoryQuantity
   * @param inventoryUnitCost
   * @example
   * // Array of lots
   * const lots = [
   *  { label: '...', quantity: '...', expiration_date: '...' }
   * ]
   */
  page.setLots = async function setLots(
    inventoryRowNumber, lotsArray, isTransferReception, inventoryQuantity, inventoryUnitCost,
  ) {
    // lots column
    await this.openLotsModal(inventoryRowNumber);

    if (inventoryQuantity) {
      await TU.input('$ctrl.stockLine.quantity', inventoryQuantity);
    }

    if (inventoryUnitCost) {
      await TU.input('$ctrl.stockLine.unit_cost', inventoryUnitCost);
      await TU.locator(by.model('$ctrl.stockLine.unit_cost')).press('Enter');

      // Handle the price confirmation dialog if it comes up
      if (await TU.isPresent('form[name="ConfirmModalForm"]')) {
        await TU.locator('form[name="ConfirmModalForm"] [data-method="submit"]').click();
      }
    }

    let index = 0;
     
    for (const lot of lotsArray) {
      const row = await GU.getRow(lotGridId, index);
      // enter lot label
      if (!isTransferReception) {
        await TU.input('row.entity.lot', lot.label, row);
      }

      // enter lot quantity
      await TU.input('row.entity.quantity', lot.quantity, row);

      // enter lot expiration date
      if (lot.expiration_date) {
        await components.datePicker.set(lot.expiration_date, row);
      }

      if (index < lotsArray.length - 1) {
        // Add another lot line
        await components.addItem.set(1, TU.locator('.modal-dialog'));
      }

      index += 1;
    }

    return TU.modal.submit();
  };

  /**
   * open lot modal
   * @param inventoryRowNumber
   */
  page.openLotsModal = async (inventoryRowNumber) => {
    const launchLots = await GU.getCell(gridId, inventoryRowNumber, 4);
    await launchLots.locator('[data-lots]').click();
    return TU.waitForSelector('.modal-dialog');
  };

  /**
   * enable fast lots insertion
   */
  page.enableFastLotsInsert = async () => {
    await TU.locator('ul.nav-tabs li[heading="Options"]').click();
    await TU.waitForSelector(by.id('enableFastInsert'));
    const checkBox = await TU.locator(by.id('enableFastInsert'));
    const isChecked = await checkBox.isChecked();
    if (!isChecked) {
      await checkBox.check();
    }
    await TU.locator('ul.nav-tabs li[heading="Lots"]').click();
    return TU.waitForSelector('label:has-text("Global Quantity")');
  };

  /**
   * fast insert lots rows
   * @param {Array} lots an array of strings
   */
  page.fastLotsInsert = async (lots) => {
    await TU.input('$ctrl.stockLine.quantity', 10);

    let index = 0;

     
    for (const lot of lots) {
      const row = await GU.getRow(lotGridId, index);
      const cell = await row.locator(by.model('row.entity.lot'));
      await TU.fill(cell, lot);
      await cell.press('Tab');
      index += 1;
    }

    // when we insert the last lot and leave with tab there will be
    // a supplementary row added
    await GU.expectRowCount(lotGridId, lots.length + 1);
  };

  /**
   * @function submit
   */
  page.submit = async function submit() {
    await TU.buttons.submit();

    // wait until the receipt modal is displayed
    await TU.waitForSelector(by.id('receipt-confirm-created'));

    // close the modal
    await TU.locator('[data-action="close"]').click();
  };
}

module.exports = StockEntryPage;
