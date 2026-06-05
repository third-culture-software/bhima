const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const VoucherRow = require('./voucherRow.class');

const components = require('../shared/components');

/**
 * A page object to wrap complex journal voucher logic into a simple page.  This
 * allows many tests to be performed with relatively little code written in the
 * tests.
 */
class ComplexVoucherPage {

  // set up the page
  constructor(initialRows) {
    // default to 2 because the page has two rows at startup
    this._rows = initialRows;
  }

  /**
   * Emulate an async constructor
   * @returns {ComplexVoucherPage} a new ComplexVoucherPage object
   */
  static async new() {
    const initialRows = [new VoucherRow(0), new VoucherRow(1)];
    return new ComplexVoucherPage(initialRows);
  }

  // set the date input
  async date(value) {
    await components.dateEditor.set(value);
    return this;
  }

  // set the description field
  async description(value) {
    await TU.input('ComplexVoucherCtrl.Voucher.details.description', value);
    return this;
  }

  // set the currency input
  async currency(id) {
    await TU.locator(`[data-currency-option="${id}"]`).click();
    return this;
  }

  // set the transfer type
  async transactionType(type) {
    await TU.uiSelect('ComplexVoucherCtrl.Voucher.details.type_id', type);
    return this;
  }

  // Select the cashbox
  async selectCashbox(name, currency) {
    // TU.uiSelect seems to have problems with the '($)' because
    // the cashbox name and currency symbol are in separate spans

    // Open the dropdown menu
    const select = await TU.locator(by.model('ToolCtrl.cashbox'));
    await select.click();

    const link = await select.locator('[role="option"]')
      .locator(`//a[span[contains(text(), "${name}")]]`)
      .locator(by.containsText(currency));
      // Note: the special xpath above: It selects 'a' elements with child 'spans' that
      // contain the desired text.  Which can then be used in the following locator.

    return link.click();
  }

  // submit the form
  async submit() {
    await TU.buttons.submit();
    return this;
  }

  // add a row to the voucher
  async addRow() {
    // click the add row button
    await TU.locator(by.id('btn-add-rows')).click();

    // create a new row reference to the last row
    const row = new VoucherRow(this._rows.length);

    // add the row to the array of rows
    this._rows.push(row);

    // return the row
    return this;
  }

  // remove a row at "index"
  removeRow(index) {
    this._rows.slice(index, 1);
  }

  // get all rows
  rows() {
    return this._rows;
  }

  // get a particular row at "index"
  row(index) {
    return this._rows[index];
  }
}

module.exports = ComplexVoucherPage;
