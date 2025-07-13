const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const GU = require('../shared/GridUtils');
const components = require('../shared/components');
const SharedStockPage = require('./stock.shared.page');

function StockRequisitionPage() {
  const page = this;
  const gridId = 'stock-requisition-grid';
  const modalGridId = 'stock-requisition-grid-articles';

  // change current depot
  page.setDepot = SharedStockPage.setDepot;

  // the grid id
  page.gridId = gridId;
  page.modalGridId = modalGridId;

  // create modal
  page.showCreateModal = async isNewRequisition => {
    const selector = isNewRequisition ? '[data-method="create-record"]' : '[data-method="create-other-record"]';
    return TU.locator(selector).click();
  };

  page.showSearchModal = () => {
    return TU.locator('[data-method="search"]').click();
  };

  // requestor select
  page.setRequestor = (requestor, type) => {
    return components.serviceOrDepotSelect.set(requestor, type);
  };

  // depot select
  page.changeDepot = depot => {
    return SharedStockPage.setDepot(depot);
  };

  page.setDepot = depot => {
    return components.depotSelect.set(depot, 'depot-supplier');
  };

  page.setRows = async number => {
    await components.addItem.set(number);
  };

  // add item
  page.addItem = async function setInventory(rowNumber, code, quantity) {
    // inventory code column
    const itemCell = await GU.getCell(modalGridId, rowNumber, 1);

    // enter data into the typeahead input.
    await TU.input('row.entity.inventory', code, itemCell);

    const externalAnchor = await TU.locator('body > ul.dropdown-menu.ng-isolate-scope:not(.ng-hide)');
    const option = await externalAnchor.locator('[role="option"]').locator(by.containsText(code)).first();
    await option.click();

    // inventory quantity column
    const quantityCell = await GU.getCell(modalGridId, rowNumber, 3);

    // set the quantity
    await TU.input('row.entity.quantity', quantity, quantityCell);
  };

  // set description
  page.setDescription = description => {
    return TU.input('$ctrl.model.description', description);
  };

  page.expectRowCount = (number) => {
    return GU.expectRowCount(gridId, number);
  };

  page.expectCellValueMatch = (row, col, value) => {
    return GU.expectCellValueMatch(gridId, row, col, value);
  };

  page.removeRequisition = async (row = 0) => {
    const cell = await GU.getCell(gridId, row, 7);
    await cell.locator('[data-method=action]').click();
    await TU.locator('[data-method=remove-record]').click();
    await TU.buttons.submit();
    await components.notification.hasSuccess();
  };

  page.updateRequisition = async (row = 0) => {
    const cell = await GU.getCell(gridId, row, 7);
    await cell.locator('[data-method=action]').click();
    await TU.locator('[data-method=edit-record]').click();
  };

  page.changeStatus = async (row, status) => {
    const cell = await GU.getCell(gridId, row, 7);
    await cell.locator('[data-method=action]').click();
    await TU.locator('[data-method=edit]').click();

    const selectStatus = TU.locator(by.id(status));
    await selectStatus.click();

    await TU.buttons.submit();
  };

  /**
   * @method submit
   */
  page.submit = async function submit() {
    await TU.buttons.submit();

    // the receipt modal is displayed
    await TU.waitForSelector(by.id('receipt-confirm-created'));
    await TU.exists(by.id('receipt-confirm-created'), true);

    // close the modal
    await TU.locator('[data-action="close"]').click();
  };
}

module.exports = StockRequisitionPage;
