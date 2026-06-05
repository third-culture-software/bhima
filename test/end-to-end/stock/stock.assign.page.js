const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const GU = require('../shared/GridUtils');
const components = require('../shared/components');

/**
 *
 */
function StockAssignPage() {
  const page = this;
  const gridId = 'stock-assign-grid';

  // the grid id
  page.gridId = gridId;

  // create modal
  page.showCreateModal = () => {
    return TU.locator('[data-method="create-record"]').click();
  };

  page.showSearchModal = () => {
    return TU.locator('[data-method="search"]').click();
  };

  // depot select
  page.setDepot = depot => {
    return components.depotSelect.set(depot);
  };

  // inventory select
  page.setInventory = text => {
    return TU.uiSelect('$ctrl.inventory_uuid', text);
  };

  // lot select
  page.setLot = text => {
    return TU.uiSelect('$ctrl.model.lot_uuid', text);
  };

  // entity select
  page.setEntity = entity => {
    return components.entitySelect.set(entity);
  };

  // set quantity
  page.setQuantity = quantity => {
    return TU.input('$ctrl.model.quantity', quantity);
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

  page.deleteAssignment = async () => {
    const cell = await GU.getCell(gridId, 0, 7);
    await cell.locator('[data-method=action]').click();
    await TU.locator('[data-method=remove-record]').click();
    await TU.buttons.submit();
  };

  /**
   * @function submit
   */
  page.submit = async function submit() {
    await TU.buttons.submit();
    // the receipt modal is displayed
    await TU.exists(by.id('receipt-confirm-created'), true);
    // close the modal
    await TU.locator('[data-action="close"]').click();
  };
}

module.exports = StockAssignPage;
