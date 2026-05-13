const { expect } = require('@playwright/test');

const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const GU = require('../shared/GridUtils');
const components = require('../shared/components');

const SharedStockPage = require('./stock.shared.page');

/**
 *
 */
function StockExitPage() {
  const page = this;

  const gridId = 'stock-exit-grid';

  // the grid id
  page.gridId = gridId;
  page.setDepot = SharedStockPage.setDepot;

  /**
   * @function setPatient
   * @param {string} reference - the patient reference
   * @param invoice
   * @param patientAlreadyCached
   */
  page.setPatient = async function setPatient(reference, invoice, patientAlreadyCached = false) {
    await components.stockEntryExitType.set('patient');

    if (!patientAlreadyCached) {
      await components.findPatient.findById(reference);
    }

    await TU.waitForSelector(by.model('$ctrl.invoiceReference')); // Wait for the prompt for invoices to appear
    await components.findInvoice.set(invoice);

    return TU.modal.submit();
  };

  // ??? /**
  //  * @method unset invoice
  //  */
  // function clickJoinInvoice() {
  //   const elm = TU.locator(by.model('$ctrl.joinInvoice'));
  //   return elm.click();
  // }

  /**
   * @function setService
   * @param {string} service - the service name
   */
  page.setService = async function setService(service) {
    await components.stockEntryExitType.set('service');
    const modalContent = TU.locator('[class="modal-content"]');
    await TU.uiSelect('$ctrl.selected', service, modalContent);
    return TU.modal.submit();
  };

  /**
   * @function setServiceRequisition
   * @param {string} requisition.service - the service requisition name
   * @param requisition
   */
  page.setServiceRequisition = async function setServiceRequisition(requisition) {
    await components.stockEntryExitType.set('service');
    const modalContent = TU.locator('[class="modal-content"]');
    await TU.uiSelect('$ctrl.selected', requisition.service, modalContent);
    await components.yesNoRadios.set('yes', 'requisitionVoucherExist');
    await components.requisitionSelect.set(requisition.reference);
    return TU.modal.submit();
  };

  /**
   * @function setDepotRequisition
   * @param {string} requisition.depot - the depot requisition name
   * @param requisition
   */
  page.setDepotRequisition = async function setDepotRequisition(requisition) {
    await components.stockEntryExitType.set('depot');
    const modalContent = TU.locator('[class="modal-content"]');
    await TU.uiSelect('$ctrl.selected', requisition.depot, modalContent);
    await components.yesNoRadios.set('yes', 'requisitionVoucherExist');
    await components.requisitionSelect.set(requisition.reference);
    return TU.modal.submit();
  };

  /**
   * @function preventDepotRequisition
   * @param {string} requisition.depot - the depot requisition name
   * @param requisition
   */
  page.preventDepotRequisition = async function preventDepotRequisition(requisition) {
    await components.stockEntryExitType.set('depot');
    const modalContent = TU.locator('[class="modal-content"]');
    await TU.uiSelect('$ctrl.selected', requisition.depot, modalContent);
    await components.yesNoRadios.set('yes', 'requisitionVoucherExist');
    await components.requisitionSelect.set(requisition.reference);
    await TU.modal.submit();

    // Verify that we get an error message
    await TU.waitForSelector(by.className(requisition.className));
    expect(await TU.isPresent(`[class="${requisition.className}"]`));

    return TU.modal.cancel();
  };

  /**
   * @function setDestinationDepot
   * @param {string} depot - the depot name
   */
  page.setDestinationDepot = async function setDestinationDepot(depot) {
    await components.stockEntryExitType.set('depot');
    const modalContent = TU.locator('[class="modal-content"]');
    await TU.uiSelect('$ctrl.selected', depot, modalContent);
    return TU.modal.submit();
  };

  /**
   * @function setLoss
   */
  page.setLoss = async function setLoss() {
    return components.stockEntryExitType.set('loss');
  };

  /**
   * @function setDescription
   * @param {string} descrition - the exit description
   * @param description
   */
  page.setDescription = function setDescription(description) {
    return TU.input('StockCtrl.stockForm.details.description', description);
  };

  /**
   * @function setDate
   * @param {string} date - the exit date
   */
  page.setDate = function setDate(date) {
    return components.dateEditor.set(date);
  };

  /**
   * @param n
   * @function addRows
   */
  page.addRows = function addRows(n) {
    return components.addItem.set(n);
  };

  /**
   * @param rowNumber
   * @param code
   * @param lot
   * @param quantity
   * @function setItem
   */
  page.setItem = async function setItem(rowNumber, code, lot, quantity) {
    const row = await GU.getRow(gridId, rowNumber);

    // Select the inventory item
    const itemCell = await row.locator(by.model('row.entity.inventory_uuid'));
    await TU.fill(itemCell, code);
    await itemCell.press('Enter');

    // Choose the desired lot
    const lotCell = await row.locator(by.model('row.entity.lot_uuid'));
    await lotCell.click();
    await TU.waitForSelector('.ui-select-choices-row-inner');
    const sel = await TU.locator(`a:has-text("${lot}")`);
    await sel.click();

    // set the quantity
    const quantityCell = await row.locator(by.model('row.entity.quantity'));
    return TU.fill(quantityCell, quantity);
  };

  /**
   * @param rowNumber
   * @param lot
   * @param quantity
   * @function setLot
   */
  page.setLot = async (rowNumber, lot, quantity) => {
    const row = await GU.getRow(gridId, rowNumber);

    const lotCell = await row.locator(by.model('row.entity.lot_uuid'));
    await lotCell.click();
    await TU.waitForSelector('.ui-select-choices-row-inner');
    const sel = await TU.locator(`a:has-text("${lot}")`);
    await sel.click();

    if (quantity) {
      const quantityCell = await row.locator(by.model('row.entity.quantity'));
      await TU.fill(quantityCell, quantity);
    }
  };

  /**
   * @function submit
   */
  page.submit = async function submit() {
    await TU.buttons.submit();

    // the receipt modal is displayed
    await TU.waitForSelector(by.id('receipt-confirm-created'));
    await TU.exists(by.id('receipt-confirm-created'), true);

    // close the modal
    return TU.buttons.close();
  };

  /**
   * @function submitError
   */
  page.submitError = async function submitError() {
    TU.buttons.submit();

    return components.notification.hasDanger();
  };

}

module.exports = StockExitPage;
