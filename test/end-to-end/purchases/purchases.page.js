const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const GU = require('../shared/GridUtils');
const addItem = require('../shared/components/bhAddItem');

/**
 *
 */
function PurchaseOrderPage() {
  const page = this;

  const btns = {
    submit : TU.modal.submit,
    clear : TU.buttons.clear,
  };

  const gridId = 'purchase-order-grid';
  page.gridId = gridId;
  const grid = GU.getGrid(gridId);

  // try to click the submit button
  page.submit = function submit() {
    return TU.buttons.submit();
  };

  // adds n rows to the grid
  page.addRows = function addRows(n) {
    return addItem.set(n);
  };

  // try to click the submit button 'Optimal Purchase Order'
  page.optimalPurchase = async function optimalPurchase() {
    await TU.locator(by.id(`optimal_purchase`)).click();
  };

  // returns n rows
  page.getRows = function getRows() {
    return grid.locator('.ui-grid-render-container-body')
      .locator(by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows track by $index'))
      .all();
  };

  // add an inventory item to the grid
  page.addInventoryItem = async function addInvoiceItem(rowNumber, code) {

    // first column of the nth row
    const itemCell = await GU.getCell(gridId, rowNumber, 1);

    // enter data into the typeahead input.  We cannot use TU.typeahead because it is appended to the body.
    await TU.input('row.entity.inventory_uuid', code, itemCell);

    const externalAnchor = TU.locator('body > ul.dropdown-menu.ng-isolate-scope:not(.ng-hide)');
    const option = externalAnchor.locator('[role="option"]').locator(by.containsText(code));
    await option.click();
  };

  /**
   * adjustItemPrice
   *
   * This function adjusts the price of the item in row {rowNumber}.
   * @param {number} rowNumber - the grid's row number to adjust
   * @param {number} price - the new transaction price to set
   */
  page.adjustItemPrice = async function adjustItemPrice(rowNumber, price) {
    // fourth column of the last nth row
    const priceCell = await GU.getCell(gridId, rowNumber, 5);
    await TU.input('row.entity.unit_price', price, priceCell);
  };

  /**
   * adjustItemQuantity
   *
   * This function adjusts the quantity of the item in row {rowNumber}.
   * @param {number} rowNumber - the grid's row number to adjust
   * @param {number} quantity - the number of items expected to have
   */
  page.adjustItemQuantity = async function adjustItemQuantity(rowNumber, quantity) {
    // third column column of the nth row
    const quantityCell = await GU.getCell(gridId, rowNumber, 4);
    await TU.input('row.entity.quantity', quantity, quantityCell);
  };

  page.addButtonEnabled = async function addButtonEnabled() {
    const button = await TU.locator(by.id('btn-add-rows'));
    return button.isEnabled();
  };

  page.submitButtonEnabled = async function submitButtonEnabled() {
    const button = await TU.locator('[data-method="submit"]');
    return button.isEnabled();
  };

  // click the reset modal button
  page.reset = async function reset() {

    // Deal with the confirmation dialog if it appears
    // This is a hack that should not be needed, but does not hurt anything.
    // @TODO figure out why this is needed and fix the root problem
    if (await TU.locator('.modal-dialog form[name="ConfirmModalForm"]').count() > 0) {
      TU.modal.submit();
    }

    await TU.locator('[data-action="close"]').click();
  };

  // bind the buttons for external use
  page.btns = btns;
}

// expose to the world!
module.exports = PurchaseOrderPage;
