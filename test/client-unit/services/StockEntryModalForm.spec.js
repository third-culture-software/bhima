/* global inject, expect, chai */
/* eslint no-unused-expressions:off, no-restricted-properties:off */
describe('test/client-unit/services/StockEntryModalForm', () => {
  beforeEach(module('bhima.services'));

  let StockForm;

  beforeEach(inject(_StockEntryModalForm_ => {
    StockForm = _StockEntryModalForm_;
  }));

  const clone = obj => JSON.parse(JSON.stringify(obj));

  it('#constructor() sets up rows as an empty array', () => {
    const form = new StockForm();
    expect(form.rows).to.be.a('array');
    expect(form.rows).to.have.length(0);
  });

  it('#constructor() calls validate() if rows are passed in as options', () => {
    const spy = chai.spy(StockForm.prototype.validate);
    StockForm.prototype.validate = spy;

    const form = new StockForm({
      rows : [{}, {}],
    });

    expect(spy).to.have.been.called.exactly(1);
    expect(form.rows).to.have.length(2);
  });

  it('#addItem() should add an item to the rows array', () => {
    const form = new StockForm();
    form.addItem();
    expect(form.rows).to.have.length(1);
    form.addItem();
    expect(form.rows).to.have.length(2);
  });

  it('#removeItem() should remove an item from the rows array at an index', () => {
    const form = new StockForm();
    form.addItem();
    form.addItem();
    form.addItem();

    expect(form.rows).to.have.length(3);

    // mock some identities
    form.rows.forEach((row, index) => {
      row.id = index;
    });

    // remove the last item
    form.removeItem(2);

    let lastItem = form.rows[form.rows.length - 1];
    expect(lastItem.id).to.equal(1);

    form.removeItem(0);
    lastItem = form.rows[form.rows.length - 1];
    expect(lastItem.id).to.equal(1);
  });

  it('#total() calculates the totals of all quantities', () => {
    const form = new StockForm({
      rows : [{ quantity : 15 }, { quantity : 25 }],
    });

    const total = 40;
    const calculated = form.total();
    expect(total).to.equal(calculated);
  });

  const sampleRow = {
    expiration_date : new Date(),
    lot : 1234,
    quantity : 10,
  };

  it('#validate() will set isValid to true for a valid row', () => {
    const form = new StockForm({
      rows : [sampleRow],
    });

    const [row] = form.rows;
    expect(row.isValid).to.equal(true);
    expect(row._error).to.equal(null);
  });

  it('#validate() will detect an invalid lot number', () => {
    const data = clone(sampleRow);
    data.lot = null;

    const form = new StockForm({ rows : [data] });
    const [row] = form.rows;

    expect(row.isValid).to.equal(false);
    expect(row.isInvalid).to.equal(true);
    expect(row._error).to.equal('STOCK.ERRORS.MISSING_LOT_NAME');
  });

  it('#validate() will detect an invalid quantity', () => {
    const data = clone(sampleRow);
    data.quantity = -100;

    const form = new StockForm({ rows : [data] });
    const [row] = form.rows;

    expect(row.isValid).to.equal(false);
    expect(row.isInvalid).to.equal(true);
    expect(row._error).to.equal('STOCK.ERRORS.INVALID_LOT_QUANTITY');
  });

  it('#validate() will detect an invalid expiration date', () => {
    const data = clone(sampleRow);

    // set date in the past by a couple years
    data.expiration_date = new Date(Date.now() - 10 ** 11);

    const form = new StockForm({ rows : [data], tracking_expiration : true });
    const [row] = form.rows;

    expect(row.isValid).to.equal(false);
    expect(row.isInvalid).to.equal(true);
    expect(row._error).to.equal('STOCK.ERRORS.INVALID_LOT_EXPIRATION');
  });

  it('#validate() will detect an invalid expiration date', () => {
    const data = clone(sampleRow);

    // set date in the past by a couple years
    data.expiration_date = new Date(Date.now() - 10 ** 11);

    const form = new StockForm({ rows : [data], tracking_expiration : true });
    const [row] = form.rows;

    expect(row.isValid).to.equal(false);
    expect(row.isInvalid).to.equal(true);
    expect(row._error).to.equal('STOCK.ERRORS.INVALID_LOT_EXPIRATION');
  });

  it('#validate() will throw an error if there are no rows', () => {
    const form = new StockForm();
    const errors = form.validate();

    expect(errors).to.deep.equal(['STOCK.ERRORS.NO_ROWS']);
  });

  it('#validate() will block when total quantity is over max quantity', () => {
    const maxQuantity = 100;
    const data = clone(sampleRow);
    data.quantity = 120;

    const form = new StockForm({ rows : [data] });
    form.setMaxQuantity(maxQuantity);

    const error = form.validate();
    expect(error).to.deep.equal(['STOCK.ERRORS.LOT_QUANTITY_OVER_GLOBAL']);
  });

  it('#validate() will pass when total quantity is under max quantity', () => {
    const maxQuantity = 100;
    const data = clone(sampleRow);
    data.quantity = 90;

    const form = new StockForm({ rows : [data] });
    form.setMaxQuantity(maxQuantity);

    const error = form.validate();
    expect(error).to.deep.equal([]);
  });

  it('#validate() will pass when total quantity is equal max quantity', () => {
    const maxQuantity = 100;
    const data = clone(sampleRow);
    data.quantity = 100;

    const form = new StockForm({ rows : [data] });
    form.setMaxQuantity(maxQuantity);

    const error = form.validate();
    expect(error).to.deep.equal([]);
  });

  it('#validate() returns an array of one or more errors', () => {
    const first = clone(sampleRow);
    const second = clone(sampleRow);
    const third = clone(sampleRow);

    // set date in the past by a couple years
    first.expiration_date = new Date(Date.now() - 10 ** 11);
    third.quantity = -100;

    const form = new StockForm({ rows : [first, second, third], tracking_expiration : true });
    delete form.unit_cost;
    const errors = form.validate();

    const expectedErrors = [
      'STOCK.ERRORS.MISSING_LOT_UNIT_COST',
      'STOCK.ERRORS.INVALID_LOT_EXPIRATION',
      'STOCK.ERRORS.INVALID_LOT_QUANTITY',
    ];

    expect(errors).to.deep.equal(expectedErrors);
  });

  it('#validate() will ignore expiration date if `tracking_expiration` is false', () => {
    const data = clone(sampleRow);
    // set date in the past by a couple years
    data.expiration_date = new Date(Date.now() - 10 ** 11);

    const form = new StockForm({ rows : [data], tracking_expiration : false });
    const errors = form.validate();
    expect(errors).to.deep.equal([]);
  });
});
