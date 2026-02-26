angular.module('bhima.services')
  .service('StockEntryModalForm', StockEntryModalForm);

StockEntryModalForm.$inject = ['uuid'];

/**
 * @param uuid
 * @function StockEntryModalForm
 * @description
 * This function creates new instances of the StockForm used for registering
 * new lots during stock entry.  It also encapsulates the business logic for
 * validation of lots, as well as removal or addition of new ones.
 */
function StockEntryModalForm(uuid) {
  const ERR_NO_ROWS = 'STOCK.ERRORS.NO_ROWS';
  const ERR_LOT_QUANTITY_OVER_GLOBAL = 'STOCK.ERRORS.LOT_QUANTITY_OVER_GLOBAL';
  const ERR_MISSING_LOT_UNIT_COST = 'STOCK.ERRORS.MISSING_LOT_UNIT_COST';
  const ERR_INVALID_QUANTITY = 'STOCK.ERRORS.INVALID_LOT_QUANTITY';
  const ERR_INVALID_EXPIRATION = 'STOCK.ERRORS.INVALID_LOT_EXPIRATION';
  const ERR_INVALID_IDENTIFIER = 'STOCK.ERRORS.MISSING_LOT_NAME';

  /**
   *
   * @param row
   */
  function Lot(row = {}) {
    this.expiration_date = row.expiration_date || new Date();
    this.unit_cost = row.unit_cost || null;
    this.quantity = row.quantity || 1;
    this.lot = row.lot || null;
    this.serial_number = row.serial_number || null;
    this.isInvalid = true;
    this.isValid = false;
    this.identifier = uuid();
    this.acquisition_date = row.acquisition_date || new Date();
    this.number_package = row.number_package || null;
    this.package_size = row.package_size || null;

    if (row.uuid) {
      this.uuid = row.uuid;
    }
  }

  /**
   *
   * @param opts
   */
  function StockForm(opts = {}) {
    this.rows = [];
    this.opts = opts;
    this.unit_cost = opts.unit_cost || 0.0;

    if (opts.rows) {
      this.rows = opts.rows.map(row => new Lot(row));
      this.validate(opts.entry_date || new Date());
    }
  }

  StockForm.prototype.addItem = function addItem(defaultValue = {}) {
    const lot = new Lot(defaultValue);
    this.rows.push(lot);
    return lot;
  };

  StockForm.prototype.addItems = function addItems(n, defaultValue = {}) {
    let lot;
    let i = n;

    // will repeat will n > 0
    while (i--) {
      lot = new Lot(defaultValue);
      this.rows.push(lot);
    }

    return lot;
  };

  StockForm.prototype.setMaxQuantity = function setMaxQuantity(value) {
    this.opts.max_quantity = value;
  };

  StockForm.prototype.setUnitCost = function setUnitCost(value) {
    this.unit_cost = value;
  };

  StockForm.prototype.removeItem = function removeItem(idx) {
    this.rows.splice(idx, 1);
    this.validate(this.opts.entry_date || new Date());
  };

  /**
   * @function total
   * @description
   * This function computes the total quantity in the form.
   */
  StockForm.prototype.total = function total() {
    return this.rows.reduce((sum, lot) => sum + lot.quantity, 0);
  };

  /**
   * @function validateSingleRow
   * @description
   * This function takes in a single row and runs validation against it.
   * @param row - row of lot info
   * @param [date] {object} - Entry date for expiration check (not always 'now')
   */
  function validateSingleRow(row, date) {
    const entryDate = date || new Date();
    let hasFutureExpirationDate = new Date(row.expiration_date) >= entryDate;
    row._error = null;

    // if the stock does not expire/have an expiration date, generate a fake one
    if (!this.opts.tracking_expiration) {
      hasFutureExpirationDate = true;
      row.expiration_date = new Date((entryDate.getFullYear() + 1000), entryDate.getMonth());
    }

    // check invalid lot expiration date
    const hasInvalidExpiration = (!row.expiration_date || !hasFutureExpirationDate);
    if (hasInvalidExpiration) {
      row._error = ERR_INVALID_EXPIRATION;
    }

    // check invalid lot quantity
    if (row.quantity <= 0) {
      row._error = ERR_INVALID_QUANTITY;
    }

    // check missing lot identifier
    if (!row.lot) {
      row._error = ERR_INVALID_IDENTIFIER;
    }

    row.isInvalid = row._error != null;
    row.isValid = !row.isInvalid;
  }

  /**
   *
   * @param date
   */
  function validateAllRows(date) {
    const errors = [];

    if (!this.rows || this.rows.length === 0) {
      errors.push(ERR_NO_ROWS);
    }

    if (this.opts.max_quantity < this.total()) {
      errors.push(ERR_LOT_QUANTITY_OVER_GLOBAL);
    }

    if (this.opts.max_quantity_consumed < this.total()) {
      errors.push(ERR_LOT_QUANTITY_OVER_GLOBAL);
    }

    if (this.opts.max_quantity_lost < this.total()) {
      errors.push(ERR_LOT_QUANTITY_OVER_GLOBAL);
    }

    if (this.unit_cost === undefined) {
      errors.push(ERR_MISSING_LOT_UNIT_COST);
    }

    this.rows.forEach(lot => {
      validateSingleRow.call(this, lot, date);

      if (lot.isInvalid) {
        errors.push(lot._error);
      }
    });

    // return unique errors
    return errors
      .filter((err, idx, arr) => arr.indexOf(err) === idx);
  }

  StockForm.prototype.validate = function validate(date) {
    return validateAllRows.call(this, date);
  };

  return StockForm;
}
