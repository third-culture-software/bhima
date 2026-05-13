const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const GU = require('../shared/GridUtils');
const components = require('../shared/components');
const SharedStockPage = require('./stock.shared.page');

/**
 *
 */
function StockAggregateConsumptionPage() {
  const page = this;
  const gridId = 'aggregated-consumption-grid';
  const modalGridId = 'lots-grid';

  // change current depot
  page.changeDepot = SharedStockPage.setDepot;

  // the grid id
  page.gridId = gridId;
  page.modalGridId = modalGridId;

  page.setFiscalPeriod = async (fiscalYear, period) => {
    return components.fiscalYearPeriodSelect.set(fiscalYear, period);
  };

  page.addRows = async number => {
    return components.addItem.set(number);
  };

  // set description
  page.setDescription = description => {
    return TU.input('StockCtrl.movement.description', description);
  };

  /**
   * @param rowIndex
   * @param columnIndex
   * @param value
   * @function setHeaderValue
   */
  page.setHeaderValue = async function setHeaderValue(rowIndex, columnIndex, value) {
    const cell = await GU.getCell(gridId, rowIndex, columnIndex);
    // ??? const inputOutStock = await cell.locator(by.id('row.treeNode.children[0].row.entity.inventory_uuid'));
    const inputOutStock = await cell.locator(by.name('days_stock_out'));
    return TU.fill(inputOutStock, value);
  };

  /**
   * @param rowIndex
   * @param columnIndex
   * @param quantity
   * @function setQuantityConsumed
   */
  page.setQuantityConsumed = async function setQuantityConsumed(rowIndex, columnIndex, quantity) {
    const quantityCell = await GU.getCell(gridId, rowIndex, columnIndex);
    return TU.input('row.entity.quantity_consumed', quantity, quantityCell);
  };

  /**
   * @param rowIndex
   * @param columnIndex
   * @param quantity
   * @function setQuantityLost
   */
  page.setQuantityLost = async function setQuantityLost(rowIndex, columnIndex, quantity) {
    const quantityCell = await GU.getCell(gridId, rowIndex, columnIndex);
    return TU.input('row.entity.quantity_lost', quantity, quantityCell);
  };

  /**
   * @param rowIndex
   * @param columnIndex
   * @function setDetailed
   */
  page.setDetailed = async function setDetailed(rowIndex, columnIndex) {
    const getCell = await GU.getCell(gridId, rowIndex, columnIndex);
    const btn = await getCell.locator(`a${by.id('aggregated_details')}`);
    return btn.click();
  };

  page.setLots = async function setLots(lots) {

    const numLots = lots.length;

     
    for (let i = 0; i < numLots; i++) {
      const dateStartCell = await GU.getCell(modalGridId, i, 1);
      const dateEndCell = await GU.getCell(modalGridId, i, 2);
      const quantityConsumptionCell = await GU.getCell(modalGridId, i, 3);
      const quantityLostCell = await GU.getCell(modalGridId, i, 4);
      await components.datePicker.set(lots[i].start_date, dateStartCell);
      await components.datePicker.set(lots[i].end_date, dateEndCell);
      await TU.input('row.entity.quantity_consumed', lots[i].quantity_consumed, quantityConsumptionCell);
      await TU.input('row.entity.quantity_lost', lots[i].quantity_lost, quantityLostCell);

      if (i < numLots - 1) {
        await components.addItem.set(1);
      } else {
        // Have to press 'Enter' on the last item to force the page to recalculate
        await quantityLostCell.locator(by.model('row.entity.quantity_lost')).press('Enter');
      }
    }
     

    return TU.modal.submit();
  };

  page.setLotsError = async function setLotsError(lots) {
    const numLots = lots.length;

     
    for (let i = 0; i < numLots; i++) {
      const dateStartCell = await GU.getCell(modalGridId, i, 1);
      const dateEndCell = await GU.getCell(modalGridId, i, 2);
      const quantityConsumptionCell = await GU.getCell(modalGridId, i, 3);
      const quantityLostCell = await GU.getCell(modalGridId, i, 4);
      await components.datePicker.set(lots[i].start_date, dateStartCell);
      await components.datePicker.set(lots[i].end_date, dateEndCell);
      await TU.input('row.entity.quantity_consumed', lots[i].quantity_consumed, quantityConsumptionCell);
      await TU.input('row.entity.quantity_lost', lots[i].quantity_lost, quantityLostCell);

      if (i < numLots - 1) {
        await components.addItem.set(1);
      } else {
        // Have to press 'Enter' on the last item to force the page to recalculate
        await quantityLostCell.locator(by.model('row.entity.quantity_lost')).press('Enter');
      }
    }
     

    await TU.waitForSelector(by.id('validation-error'));

    return TU.modal.cancel();
  };

  /**
   * @function submit
   */
  page.submit = async function submit() {
    await TU.buttons.submit();
    // wait until the receipt modal is displayed
    await TU.waitForSelector(by.id('receipt-confirm-created'));
    // close the modal
    return TU.locator('[data-action="close"]').click();
  };

  /**
   * @function submitErrorQuantity
   */
  page.submitErrorQuantity = async function submitErrorQuantity() {
    TU.buttons.submit();

    return components.notification.hasDanger();
  };

}

module.exports = StockAggregateConsumptionPage;
