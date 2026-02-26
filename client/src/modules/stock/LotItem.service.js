angular.module('bhima.services').service('LotItemService', LotItemService);

LotItemService.$inject = ['uuid', '$translate'];

/**
 * @param uuid
 * @param $translate
 * @class Lot
 */
function LotItemService(uuid, $translate) {

  // error codes that can apply to a lot
  const ER_EXPIRED = 'STOCK.ERRORS.LOT_EXPIRED';
  const ER_MISSING_INVENTORY = 'STOCK.ERRORS.LOT_MISSING_INVENTORY_INFO';
  const ER_MISSING_LOT = 'STOCK.ERRORS.LOT_MISSING_LOT_INFO';
  const ER_NEGATIVE_QUANTITY = 'STOCK.ERRORS.LOT_NEGATIVE_QUANTITY';
  const ER_OVERCONSUMPTION = 'STOCK.ERRORS.LOT_OVERCONSUMPTION';
  const ER_UNUSED = 'STOCK.ERRORS.LOT_UNUSED';
  const ER_UNINITIALISED = 'STOCK.ERRORS.UNINITIALISED';

  // toggles the error message based on the condition
  /**
   *
   * @param condition
   * @param set
   * @param msg
   */
  function toggleErrorMessage(condition, set, msg) {
    if (condition) { set.add(msg); } else { set.delete(msg); }
  }
  /**
   * @param options
   * @class Lot
   */
  function Lot(options) {
    this.uuid = uuid();

    // inventory properties
    this.inventory_uuid = null;
    this.code = null;
    this.text = null;
    this.group_uuid = null;
    this.unit_type = null;

    // lot properties
    this.lot_uuid = null;
    this.label = null;
    this.quantity = 0;
    this.expiration_date = null;

    // validation properities
    this.__is_asset = false;
    this.__tracking_expiration = true;
    this.__tracking_consumption = true;
    this.__tooltip = '';

    // stock-exit specific properties.  These will not be used
    // in the general case of lots loaded from the database, but
    // is useful for the stock store.
    this._quantity_available = 0;
    this._initialised = false;
    this._errors = new Set(); // ensures only a single instance of an error exists at any time.

    // if options were passed in, use them to configure the lot
    if (options) {
      this.configure(options);
    }
  }

  /**
   * @function errors
   * @description
   * Formats the errors with a nice i18n formating
   */
  Lot.prototype.errors = function errors() {
    return Array.from(this._errors)
      .map(i18nKey => $translate.instant(i18nKey, this));
  };

  /**
   * @param date
   * @param checkExpirationDate
   * @function validate
   * @description
   * This function ensures that is lot is valid.  A valid lot is:
   *   - has all required information
   *   - is not "unused" (has stock available, but quantity = 0)
   *   - is not expired.
   *
   * Note that this takes a comparison date to pass to isExpired().
   * The comparison date will only trigger expiry if the expiration
   * date is before the comparison date.  Thus, if you pass it a
   * date for yesterday and the expiration is today, it will not
   * register as expired.
   */
  Lot.prototype.validate = function validate(date, checkExpirationDate = true) {

    // set the "uninitialised" flag first.  Return quickly if not - no
    // need to validate further
    toggleErrorMessage(!this._initialised, this._errors, ER_UNINITIALISED);
    if (!this._initialised) { return false; }

    // we run all these individually to fill out the _errors conditions
    const hasInventory = this.hasInventoryInformation();
    const hasLot = this.hasLotInformation();
    const isPositive = this.hasPositiveQuantity();
    const isUsed = !this.isUnused();
    const hasEnough = this.hasEnoughQuantityAvailable();

    // custom expiration logic, to allow external validation to turn off the expiration check
    // if necessary
    let isNotExpired;
    if (checkExpirationDate) {
      isNotExpired = !this.isExpired(date);
    } else {
      isNotExpired = true;
      toggleErrorMessage(false, this._errors, ER_EXPIRED);
    }

    // add in the tooltip
    this.__tooltip = this.errors().pop() || '';

    return hasInventory
      && hasLot
      && isPositive
      && isUsed
      && hasEnough
      && isNotExpired;
  };

  // checks if a value is a uuid
  /**
   *
   * @param uid
   */
  function isUuid(uid) {
    return typeof uid === 'string' && uid.length === 32;
  }

  /**
   * @function hasInventoryInformation
   * @description
   * Checks if the inventory information is available.
   */
  Lot.prototype.hasInventoryInformation = function hasInventoryInformation() {
    const hasInfo = isUuid(this.inventory_uuid)
      && typeof this.code === 'string'
      && typeof this.unit_type === 'string'
      && typeof this.text === 'string';

    toggleErrorMessage(!hasInfo, this._errors, ER_MISSING_INVENTORY);

    return hasInfo;
  };

  /**
   * @function hasLotInformation
   * @description
   * Checks if the lot information is available.
   */
  Lot.prototype.hasLotInformation = function hasLotInformation() {
    const hasInfo = isUuid(this.lot_uuid)
      && typeof this.label === 'string'
      && typeof this.quantity === 'number';

    toggleErrorMessage(!hasInfo, this._errors, ER_MISSING_LOT);

    return hasInfo;
  };

  /**
   * @param comparisonDate
   * @function isExpired
   * @description
   * This function labels the lot as expired or not.  The logic is thus:
   *
   * 1) If the expiration date of the inventory should not be tracked (e.g. an asset)
   *    we always return FALSE: the lot is not expired.  Note this condition applies
   *    even if the lot has an expiration date and even if that expiration date is past.
   * 2) If is_expired is set, we return that value rather than performing a
   *    calculation.  This allows the server to have the same logic as the client and
   *    override the logic here without overriding the error handling.
   * 3) If a date comparison is passed in, the lot's expiration state is computed by
   *    comparing to the comparison date.  If the lot's expiration_date  is before the
   *    comparison date, it is considered expired.  If the lot's expiration_date is after,
   *    it is considered valid.
   * 4) If no comparison date is provided, the same comparison is performed with today's
   *    date (the date of the client computer).  Thus, if the expiration date is before
   *    the current date, the lot is considered expired.  If the expiration date is the
   *    same or after the current date, it is considered not expired.
   */
  Lot.prototype.isExpired = function isExpired(comparisonDate = new Date()) {

    let isLotExpired;

    // if we are not tracking expiration, always return false.
    if (this.__tracking_expiration === false) {
      isLotExpired = false;

    // the `is_expired` flag is set on the server.  If this
    // flag is set, return the results of this flag.
    } else if (this.is_expired !== undefined) {
      isLotExpired = !!this.is_expired;

    // if a date has been passed in, it will validate against that date
    // (for example, if this is a past date).  If not, it will validate
    // against the current date.
    } else {
      isLotExpired = this.expiration_date < comparisonDate;
    }

    toggleErrorMessage(isLotExpired, this._errors, ER_EXPIRED);

    return isLotExpired;
  };

  /**
   * @function isEmpty
   * @description
   * Returns true if the quantity is 0.
   */
  Lot.prototype.isEmpty = function isEmpty() {
    const hasEmptyQuantity = this.quantity === 0;
    return hasEmptyQuantity;
  };

  /**
   * @function isUnused
   * @description
   * Returns true if the lot has quantity available and is unused. This is to catch
   * error cases where a user did not complete the form correctly.  However, if a lot
   * is empty by default (no quantity in stock), no error is triggered.
   */
  Lot.prototype.isUnused = function isUnused() {
    const hasEmptyQuantityAndUnused = this.isEmpty() && this._quantity_available !== 0;
    toggleErrorMessage(hasEmptyQuantityAndUnused, this._errors, ER_UNUSED);
    return hasEmptyQuantityAndUnused;
  };

  /**
   * @function isConsumable
   * @description
   * Returns true if the lot is consumable.
   */
  Lot.prototype.isConsumable = function isConsumable() {
    return this.consumable === 1;
  };

  /**
   * @function isAsset
   * @description
   * Returns true if the lot is an asset.
   */
  Lot.prototype.isAsset = function isAsset() {
    return !!this.__is_asset;
  };

  /**
   * @param item
   * @function configure
   * @description
   * This configures the lot.
   */
  Lot.prototype.configure = function configure(item) {
    this._initialised = true;

    const clone = { ...item };
    delete clone.uuid;

    if (clone.tracking_consumption !== undefined) {
      this.setTrackingConsumption(clone.tracking_consumption);
      delete clone.tracking_consumption;
    }

    if (clone.tracking_expiration !== undefined) {
      this.setTrackingExpiration(clone.tracking_expiration);
      delete clone.tracking_expiration;
    }

    if (clone.is_asset !== undefined) {
      this.setAsset(clone.is_asset);
      delete clone.is_asset;
    }

    // assign properties to current lot
    Object.assign(this, clone);

    // set human readable text of inventory
    this.hrtext = ''.concat(this.code, ' - ', this.text).trim();

    // set the total quantity available
    if (clone.quantity !== undefined) {
      this._quantity_available = clone.quantity;
    }

    if (clone._quantity_available !== undefined) {
      this._quantity_available = clone._quantity_available;
    }

    // parse the date if it is not already a date
    if (!(this.expiration_date instanceof Date) && this.expiration_date !== undefined) {
      this.expiration_date = new Date(this.expiration_date);
    }
  };

  /**
   * @function hasEnoughQuantityAvailable
   * @description
   * Returns true if the available quantity in the lot is enough to satisfy the
   * quantity required.
   */
  Lot.prototype.hasEnoughQuantityAvailable = function hasEnoughQuantityAvailable() {
    const hasEnoughQuantity = this.quantity <= this._quantity_available;
    toggleErrorMessage(!hasEnoughQuantity, this._errors, ER_OVERCONSUMPTION);
    return hasEnoughQuantity;
  };

  /**
   * @function hasPositiveQuantity
   * @description returns true if the both quantities used and available are
   * true.
   */
  Lot.prototype.hasPositiveQuantity = function hasPositiveQuantity() {
    const isPositive = this.quantity >= 0;
    toggleErrorMessage(!isPositive, this._errors, ER_NEGATIVE_QUANTITY);
    return isPositive;
  };

  /**
   * @param bool
   * @function setAsset
   * @description
   * Sets a lot to be an asset.
   */
  Lot.prototype.setAsset = function setAsset(bool) {
    this.__is_asset = bool;
  };

  /**
   * @param bool
   * @function setTrackingExpiration
   * @description
   * Sets the tracking expiration condition
   */
  Lot.prototype.setTrackingExpiration = function setTrackingExpiration(bool) {
    this.__tracking_expiration = bool;
  };

  /**
   * @param bool
   * @function setTrackingConsumption
   * @description
   * Sets the tracking consumption condition
   */
  Lot.prototype.setTrackingConsumption = function setTrackingConsumption(bool) {
    this.__tracking_consumption = bool;
  };

  /**
   * @function formatForExport
   * @description
   * This function formats the lot for export to CSV using the ui-grid's
   * internal CSV exporter.
   */
  Lot.prototype.formatForExport = function formatForExport() {
    return [
      this.code,
      this.text,
      this.label,
      this.quantity,
      this.unit_type,
      this._quantity_available,
      this.expiration_date.toLocaleString(),
    ]
      .map(value => ({ value }));
  };

  return Lot;
}
