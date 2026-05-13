const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const GU = require('../shared/GridUtils');
const components = require('../shared/components');
const SharedStockPage = require('./stock.shared.page');

/**
 *
 */
function StockAdjustmentPage() {
  const page = this;

  const gridId = 'stock-adjustment-grid';

  // the grid id
  page.gridId = gridId;
  page.setDepot = SharedStockPage.setDepot;

  /**
   * @function setAdjustment
   * @param {number} radionIndex
   * @param value
   */
  page.setAdjustment = function setAdjustment(value) {
    return TU.locator(by.id(`btn-${value}`)).click();
  };

  /**
   * @function setDescription
   * @param {string} descrition - the exit description
   * @param description
   */
  page.setDescription = function setDescription(description) {
    return TU.input('StockCtrl.movement.description', description);
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
  page.setItem = async function setInventory(rowNumber, code, lot, quantity) {

    // enter inventory code into the typeahead input.
    const itemCell = await GU.getCell(gridId, rowNumber, 1);
    await TU.input('row.entity.inventory', code, itemCell);

    const externalAnchor = TU.locator('body > ul.dropdown-menu.ng-isolate-scope:not(.ng-hide)');
    const option = externalAnchor.locator('[role="option"]').locator(by.containsText(code));
    await option.click();

    // select the inventory lot
    const lotCell = await GU.getCell(gridId, rowNumber, 3);
    await TU.uiSelectAppended('row.entity.lot', lot, lotCell);

    // set the quantity
    const quantityCell = await GU.getCell(gridId, rowNumber, 4);
    await TU.input('row.entity.quantity', quantity, quantityCell);
  };

  /**
   * @param row
   * @param col
   * @param quantity
   * @function setQuantity
   */
  page.setQuantity = async (row, col, quantity) => {
    const quantityCell = await GU.getCell(gridId, row, col);
    await TU.input('row.entity.quantity', quantity, quantityCell);
  };

  /**
   * @function submit
   */
  page.submit = async function submit() {
    await TU.buttons.submit();

    // close the modal
    await TU.locator('[data-action="close"]').click();
  };
}

module.exports = StockAdjustmentPage;
