angular.module('bhima.services')
  .service('StockExitFormService', StockExitFormService);

StockExitFormService.$inject = [
  'Store', 'AppCache', 'SessionService', '$timeout', 'bhConstants',
  'DepotService', 'Pool', 'LotItemService', 'StockExitFormHelperService', 'util', '$translate',
  'StockService', '$filter',
];

/**
 * @param Store
 * @param AppCache
 * @param SessionService
 * @param Session
 * @param $timeout
 * @param bhConstants
 * @param DepotService
 * @param Depots
 * @param Pool
 * @param LotItemService
 * @param StockExitFormHelperService
 * @param Lot
 * @param Helpers
 * @param util
 * @param $translate
 * @param StockService
 * @param Stock
 * @param $filter
 * @class StockExitFormService
 * @description
 * This form powers the stock exit form in BHIMA.
 */
function StockExitFormService(
  Store, AppCache, Session, $timeout, bhConstants,
  Depots, Pool, Lot, Helpers, util, $translate,
  Stock, $filter,
) {

  const {
    TO_PATIENT, TO_LOSS, TO_SERVICE, TO_OTHER_DEPOT,
  } = bhConstants.flux;

  const today = new Date();
  const $date = $filter('date');

  const ERR_LOT_ERRORS = 'STOCK.MESSAGES.ERR_LOT_ERRORS';
  const ERR_NO_BARCODE_MATCH_IN_DEPOT = 'STOCK.MESSAGES.ERR_NO_BARCODE_MATCH_IN_DEPOT';
  const ERR_NO_DESTINATION = 'STOCK.MESSAGES.ERR_NO_DESTINATION';
  const INFO_EXIT_TYPE_SET_NEEDS_LOTS = 'STOCK.MESSAGES.INFO_EXIT_TYPE_SET_NEEDS_LOTS';
  const INFO_NEEDS_LOTS = 'STOCK.MESSAGES.INFO_NEEDS_LOTS';
  const INFO_NO_EXIT_TYPE = 'STOCK.MESSAGES.INFO_NO_EXIT_TYPE';
  const SUCCESS_FILLED_N_ITEMS = 'STOCK.MESSAGES.SUCCESS_FILLED_N_ITEMS';
  const WARN_INSUFFICIENT_QUANTITY = 'STOCK.MESSAGES.WARN_INSUFFICIENT_QUANTITY';
  const WARN_SOME_SHIPMENT_LOTS_EXHAUSTED = 'STOCK.MESSAGES.WARN_SOME_SHIPMENT_LOTS_EXHAUSTED';
  const WARN_NOT_CONSUMABLE_INVOICE = 'STOCK.MESSAGES.WARN_NOT_CONSUMABLE_INVOICE';
  const WARN_OUT_OF_STOCK_QUANTITY = 'STOCK.MESSAGES.WARN_OUT_OF_STOCK_QUANTITY';
  const WARN_PAST_DATE = 'STOCK.MESSAGES.WARN_PAST_DATE';

  /**
   * @param cacheKey
   * @class
   */
  function StockExitForm(cacheKey) {
    if (!cacheKey) {
      throw new Error('StockExitForm expected a cacheKey, but it was not provided.');
    }

    this.cache = AppCache(cacheKey);
    this.details = { is_exit : 1 };
    this.store = new Store({ identifier : 'uuid', data : [] });
    this.exitTypePredefined = false;

    // this flag will filter out lots from the display that contain expired elements
    this.allowExpired = true;

    // this variable is private and will contain the stock for the current depot.
    this._pool = new Pool('lot_uuid', []);

    // this is used to power the loading indicator
    this._queriesInProgress = 0;

    this._messages = new Map();
  }

  /**
   * Set flag to allow or disable expired stock
   * @param {boolean} flag
   */
  StockExitForm.prototype.setAllowExpired = function setAllowExpired(flag) {
    this.allowExpired = flag;
  };

  /**
   * Set flag that the exit type is predefined
   * @param {boolean} flag
   */
  StockExitForm.prototype.setExitTypePredefined = function setExitTypePredefined(flag) {
    this.exitTypePredefined = flag;
  };

  StockExitForm.prototype._toggleInfoMessage = function _toggleInfoMessage(
    shouldShowMsg, msgType, msgText, msgKeys = {},
  ) {
    // the first thing we do is remove the previous message if it exists.  This makes sure that
    // we will refresh the view as needed.
    this._messages.delete(msgText);

    if (shouldShowMsg) {
      this._messages.set(msgText, { type : msgType, text : msgText, keys : msgKeys });
    }
  };

  /**
   * @function setup
   * @description
   * This function initializes the journal voucher form with data.  By default,
   * two lines are always present in the form.
   */
  StockExitForm.prototype.setup = function setup() {
    this._messages.clear();

    this.details = {
      date : new Date(),
      user_id : Session.user.id,
      is_exit : 1,
    };

    // show the informational message that we need to select an exit type.
    if (!this.exitTypePredefined) {
      this._toggleInfoMessage(true, 'info', INFO_NO_EXIT_TYPE, this.details);
    }
  };

  /**
   * @function messages
   * @description
   * This function powers the message pane on the stock exit form.  It provides
   * the user with up to date information about what errors are being encountered
   * and what they need to do next.
   */
  StockExitForm.prototype.messages = function messages() {

    // the display ordering in the message pane
    const order = ['info', 'warn', 'success', 'error'];

    const msgs = Array.from(this._messages.values())
      .sort((a, b) => order.indexOf(a.type) > order.indexOf(b.type));

    return msgs
      .map(msg => ({ ...msg, text : $translate.instant(msg.text, msg.keys) }));
  };

  /**
   * @function isLoading
   * @description
   * Returns true if the form is waiting for data.
   */
  StockExitForm.prototype.isLoading = function isLoading() {
    return this._queriesInProgress !== 0;
  };

  /**
   * @param depotUuid
   * @param date
   * @function fetchQuantityInStock
   * @description
   * Loads the quantity in stock for the depot at a given date.
   */
  StockExitForm.prototype.fetchQuantityInStock = function fetchQuantityInStock(depotUuid, date) {
    if (!depotUuid || !date) { return {}; }

    // format date into something that can be cached.
    const dateFormatted = $date(date, 'yyyy-MM-dd');
    const parameters = { consumable : 1, inStock : true, date : dateFormatted };

    this._queriesInProgress++;

    // get the quantity in stock for this depot
    return Depots.getStockQuantityForDate(depotUuid, parameters)
      .then(stock => {
        const available = stock
          .map(item => {
            const lot = new Lot(item);

            // set the default quantity when selected in the grid
            lot.quantity = lot.isAsset() ? 1 : 0;

            // FIXME(@jniles) - need to reset the _quantity_available
            // for some reason.   My logic must be broken somewhere.
            lot._quantity_available = item.quantity;

            return lot;
          });

        this._pool.initialize('lot_uuid', available);

        this._queriesInProgress--;

        this.validate();
      });
  };

  /**
   * @param inventoryUuid
   * @param lotUuid
   * @function listLotsForInventory
   * @description
   * This lists the lots for a given inventory by its uuid.
   */
  StockExitForm.prototype.listLotsForInventory = function listLotsForInventory(inventoryUuid, lotUuid) {
    const available = this._pool.list()
      .filter(row => row.inventory_uuid === inventoryUuid)
      .filter(row => (this.allowExpired ? true : !row.isExpired(this.details.date)))
      .sort((a, b) => a.expiration_date > b.expiration_date);

    if (lotUuid) {
      const lot = this._pool.unavailable.get(lotUuid);
      if (lot) {
        return [lot, ...available];
      }
    }

    return available;
  };

  StockExitForm.prototype.listAvailableInventory = function listAvailableInventory() {
    // prefilter by the expiration condition
    const available = this._pool.list()
      .filter(row => (this.allowExpired ? true : !row.isExpired(this.details.date)));

    return util.getUniqueBy(available, 'inventory_uuid');
  };

  /**
   * @param inventoryUuid
   * @function updateLotListings
   * @description
   * Updates the lot listings based on what is actually used in the grid.
   */
  StockExitForm.prototype.updateLotListings = function updateLotListings(inventoryUuid) {
    const usedLotUuids = new Set(this.store.data
      .filter(row => row.inventory_uuid === inventoryUuid)
      .map(row => row.lot_uuid));

    // get all lots that are no longer used
    this._pool.unavailable.data
      .filter(lot => !usedLotUuids.has(lot.lot_uuid) && lot._quantity_available > 0)
      .forEach(lot => { this._pool.release(lot.lot_uuid); });
  };

  /**
   * @param depot
   * @function setDepot()
   * @description
   * This sets the depot on the stock form and reloads the quantities in stock.
   */
  StockExitForm.prototype.setDepot = function setDepot(depot) {
    // clear everything and reload the form.
    this.setup();

    this.details.depot_uuid = depot.uuid;
    this.depot = depot;

    return this.fetchQuantityInStock(this.details.depot_uuid, this.details.date);
  };

  /**
   * @param date
   * @function setDate()
   * @description
   * Sets the date and reloads the quantites in stock.
   */
  StockExitForm.prototype.setDate = function setDate(date) {
    this.details.date = date;

    const isPastDate = this.details.date < today;
    this._toggleInfoMessage(isPastDate, 'warn', WARN_PAST_DATE, this.details);

    return this.fetchQuantityInStock(this.details.depot_uuid, this.details.date);
  };

  // utility function to return true if we are in the stock loss group
  StockExitForm.prototype._isStockLoss = function isStockLoss() {
    return this.details.exit_type === 'loss';
  };

  /**
   * @param type
   * @function setExitType
   * @description
   * This sets the exit type.
   */
  StockExitForm.prototype.setExitType = function setExitType(type) {
    this.details.exit_type = type;
    this._toggleInfoMessage(false, 'info', INFO_NO_EXIT_TYPE, this.details);

    // clear any previous values set by an exit type
    // NOTE(@jniles) - this means that we _must_ call this before setting the other exit types
    delete this.details.invoice_uuid;
    delete this.details.stock_requisition_uuid;
    delete this.details.entity_uuid;

    // reset store by releasing all locks on items
    // and clearing the data
    this.store.data.forEach(item => this._pool.release(item.lot_uuid));
    this.store.clear();
  };

  StockExitForm.prototype.setLotsFromShipmentList = function setLotsFromShipmentList(lots, uuidKey = 'uuid') {
    const available = [];
    const unavailable = [];
    const insufficient = [];

    const lotsInShipment = lots.map(lot => lot.lot_uuid);
    const lotsInPool = this._pool.list().map(lot => lot.lot_uuid);
    let lotsUnavailable = false;
    lotsInShipment.forEach(uuid => {
      if (!lotsInPool.includes(uuid)) {
        // If a lot from the shipment is not available in the pool, it probably
        // means some of the lots in a shipment were exhausted between
        // creating the shipment and doing the corresponding stock exit.
        lotsUnavailable = true;
      }
    });

    const getLot = uuid => lots.filter(lot => lot[uuidKey] === uuid);

    const addLot = (item, quantity) => {
      const lot = new Lot(item);
      lot._quantity_available = item._quantity_available;
      lot.quantity = quantity;
      lot.validate(this.details.date, !this._isStockLoss());
      this.store.post(lot);
      this._pool.use(item.lot_uuid);
    };

    this._pool.list()
      .forEach(lot => {

        // Ignore all lots that are not in the shipment
        if (!lotsInShipment.includes(lot.lot_uuid)) {
          return;
        }

        const matches = getLot(lot.lot_uuid);

        if (matches.length > 0) {
          available.push(lot);
        } else {
          unavailable.push(lot);
        }
      });

    // If the pool does not contain one of the lots that is the shipment,
    // that is because there is no stock remaining for that lot.  So for these
    // lots we need to reconstruct the lot and add it to the unavailable list
    // to improve the error messages.   Also need better logic to warn when
    // a lot does not have the full quantity requested.
    // @todo: Add fix for this - 4/18/22 JMC

    const hasNoConsumableItems = (available.length === 0 && unavailable.length === 0);
    this._toggleInfoMessage(
      hasNoConsumableItems,
      'warn',
      WARN_NOT_CONSUMABLE_INVOICE,
      { ...this.details, lots },
    );

    if (hasNoConsumableItems) {
      return;
    }

    available.forEach(lot => {
      const [requested] = getLot(lot[uuidKey]);
      const match = lot;
      match.quantity = requested.quantity;
      match.condition_id = requested.condition_id;

      let requestedQuantity = match.quantity;

      // escape hatch - if we don't need anymore, just return.
      if (requestedQuantity === 0) { return; }

      // this is how much is available to us to use
      const availableQuantity = lot._quantity_available;

      // if the available quantity is greater than or equal to the required
      // quantity, allocate the entire available quantity to this lot item
      // and reduce the requested quantity by that amount.
      if (availableQuantity >= requestedQuantity) {
        addLot(match, requestedQuantity);
        requestedQuantity = 0;

      // otherwise, we need to reduce by the quantity available in the lot,
      // and move to the next lot to start consuming it.
      } else {
        addLot(match, availableQuantity);
        requestedQuantity -= availableQuantity;
      }

      // if there is still requested quantity left over, add this to the insufficient array.
      // TODO(@jniles) - should we tell the user the quantity that isn't available?
      if (requestedQuantity > 0) {
        insufficient.push(lot);
      }
    });

    // this makes an array of labels not longer than 5 to present
    // to the user in a nice warning/error message.
    /**
     *
     * @param array
     */
    function makeUniqueLabels(array) {
      const items = array
        .map(row => row.text)
        .filter((label, index, arr) => arr.indexOf(label) === index)
        .sort((a, b) => a.localeCompare(b));

      if (items.length > 5) {
        const len = items.length - 4;
        return [...items.slice(0, 5), `(+${len} ...), `].join(', ');
      }

      return items.join(', ');
    }

    // make nice text for error messages
    const unavailableLabels = makeUniqueLabels(unavailable);
    const insufficientLabels = makeUniqueLabels(insufficient);

    // finally, toggle compute the error codes
    this._toggleInfoMessage(
      lotsUnavailable, 'warn', WARN_SOME_SHIPMENT_LOTS_EXHAUSTED, {},
    );

    this._toggleInfoMessage(
      unavailable.length > 0, 'error', WARN_OUT_OF_STOCK_QUANTITY, { hrText : unavailableLabels },
    );

    this._toggleInfoMessage(
      insufficient.length > 0, 'warn', WARN_INSUFFICIENT_QUANTITY, { hrText : insufficientLabels },
    );

    this._toggleInfoMessage(available.length > 0, 'success', SUCCESS_FILLED_N_ITEMS, { count : available.length });

  };

  StockExitForm.prototype.setLotsFromInventoryList = function setLotsFromInventoryList(inventories, uuidKey = 'uuid') {
    // three lists
    // - one to contain the inventories that have stock available in the depot
    // - one to contain the inventories that do not have stock available in the depot
    // - one to contain inventories that have stock, but the quantity isn't sufficient
    const available = [];
    const unavailable = [];
    const insufficient = [];

    inventories

    // filter out all unconsumable inventories
      .filter(inventory => inventory.consumable)

    // classify all inventory as available/unavailable
      .forEach(inventory => {
        const matches = this.listLotsForInventory(inventory[uuidKey]);

        if (matches.length > 0) {
          available.push(inventory);
        } else {
          unavailable.push(inventory);
        }
      });

    const hasNoConsumableItems = (available.length === 0 && unavailable.length === 0);
    this._toggleInfoMessage(
      hasNoConsumableItems,
      'warn',
      WARN_NOT_CONSUMABLE_INVOICE,
      { ...this.details, inventories },
    );

    // if there are no consumable items in the invoice, this will exit early
    if (hasNoConsumableItems) {
      return;
    }

    // adds a lot to the grid.
    const addLotWithQuantity = (item, quantity) => {
      const lot = new Lot(item);
      lot._quantity_available = item._quantity_available;
      lot.quantity = quantity;
      lot.validate(this.details.date, !this._isStockLoss());
      this.store.post(lot);
      this._pool.use(item.lot_uuid);
    };

    // loop through the loaded inventory and assign the quantity
    available.forEach(inventory => {
      const matches = this.listLotsForInventory(inventory[uuidKey]);

      let requestedQuantity = inventory.quantity;

      // loop through the matches, allocating quantities to the inventory items.
      matches.forEach(match => {

        // escape hatch - if we don't need anymore, just return.
        if (requestedQuantity === 0) { return; }

        // this is how much is available to us to use
        const availableQuantity = match._quantity_available;

        // if the available quantity is greater than or equal to the required
        // quantity, allocate the entire available quantity to this lot item
        // and reduce the requested quantity by that amount.
        if (availableQuantity >= requestedQuantity) {
          addLotWithQuantity(match, requestedQuantity);
          requestedQuantity = 0;

        // otherwise, we need to reduce by the quantity available in the lot,
        // and move to the next lot to start consuming it.
        } else {
          addLotWithQuantity(match, availableQuantity);
          requestedQuantity -= availableQuantity;
        }
      });

      // if there is still requested quantity left over, add this to the insufficient array.
      // TODO(@jniles) - should we tell the user the quantity that isn't available?
      if (requestedQuantity > 0) {
        insufficient.push(inventory);
      }
    });

    // this makes an array of labels not longer than 5 to present
    // to the user in a nice warning/error message.
    /**
     *
     * @param array
     */
    function makeUniqueLabels(array) {
      const items = array
        .map(row => row.text)
        .filter((label, index, arr) => arr.indexOf(label) === index)
        .sort((a, b) => a.localeCompare(b));

      if (items.length > 5) {
        const len = items.length - 4;
        return [...items.slice(0, 5), `(+${len} ...), `].join(', ');
      }

      return items.join(', ');
    }

    // make nice text for error messages
    const unavailableLabels = makeUniqueLabels(unavailable);
    const insufficientLabels = makeUniqueLabels(insufficient);

    // finally, toggle compute the error codes
    this._toggleInfoMessage(
      unavailable.length > 0, 'error', WARN_OUT_OF_STOCK_QUANTITY, { hrText : unavailableLabels },
    );

    this._toggleInfoMessage(
      insufficient.length > 0, 'warn', WARN_INSUFFICIENT_QUANTITY, { hrText : insufficientLabels },
    );

    this._toggleInfoMessage(available.length > 0, 'success', SUCCESS_FILLED_N_ITEMS, { count : available.length });
  };

  /**
   * @param patient
   * @function setPatientDistribution
   * @description
   * Sets the form up for a patient distribution.
   */
  StockExitForm.prototype.setPatientDistribution = function setPatientDistribution(patient) {
    this.details.entity_uuid = patient.uuid;
    this.details.invoice_uuid = patient.invoice.details.uuid;
    this.details.flux_id = TO_PATIENT;
    this.store.clear();

    // TODO(@jniles) - ensure that all the data is loaded by this point.

    // request the lots from a list of inventory items.
    this.setLotsFromInventoryList(patient.invoice.items, 'inventory_uuid');
  };

  /**
   * @param service
   * @function setServiceDistribution
   * @description
   * Sets the form up for a service distribution.
   */
  StockExitForm.prototype.setServiceDistribution = function setServiceDistribution(service) {
    this.details.entity_uuid = service.uuid;
    this.details.flux_id = TO_SERVICE;

    if (service.requisition) {
      this.details.stock_requisition_uuid = service.requisition.uuid;
      this.setLotsFromInventoryList(service.requisition.items, 'inventory_uuid');
    }
  };

  /**
   * @param destDepot
   * @function setDepotDistribution
   * @description
   * Sets the form up for a depot distribution.
   */
  StockExitForm.prototype.setDepotDistribution = function setDepotDistribution(destDepot) {
    this.details.entity_uuid = destDepot.uuid;
    this.details.flux_id = TO_OTHER_DEPOT;

    // depot movement information required by the server API
    // @fixme because of redundant information
    this.details.from_depot = this.depot.uuid;
    this.details.to_depot = destDepot.uuid;
    this.details.isExit = true;

    if (destDepot.requisition) {
      this.details.stock_requisition_uuid = destDepot.requisition.uuid;
      this.setLotsFromInventoryList(destDepot.requisition.items, 'inventory_uuid');
    }

    if (destDepot.shipment) {
      this.details.shipment_uuid = destDepot.shipment.uuid;
      this.setLotsFromShipmentList(destDepot.shipment.lots, 'lot_uuid');
    }
  };

  /**
   * @function setLossDistribution
   * @description
   * Sets the form up for a loss distribution.
   */
  StockExitForm.prototype.setLossDistribution = function setLossDistribution() {
    this.details.flux_id = TO_LOSS;
  };

  /**
   * @function addItems
   * @description
   * Adds an item to the grid.
   * @param {number} n - the number of items to add to the grid
   */
  StockExitForm.prototype.addItems = function addItems(n) {
    let elt;
    let i = n;

    // will repeat will n > 0
    while (i--) {
      elt = new Lot();
      this.store.post(elt);
    }

    this.validate();

    return elt;
  };

  StockExitForm.prototype.addLotByBarcode = function addLotByBarcode(code) {
    // parse the barcode
    const uuid = code.replace('LT', '').trim();

    const lot = this._pool.list()
      .find(plot => plot.lot_uuid.slice(0, uuid.length) === uuid);

    if (lot) {
      const row = this.addItems(1);
      this.configureItem(row, lot);
    } else {
      this._toggleInfoMessage(true, 'error', ERR_NO_BARCODE_MATCH_IN_DEPOT, { barcode : code });
    }
  };

  /**
   * @param row
   * @param item
   * @function configureItem
   * @description
   * A shorthand for configuring and item in the grid via the inventory dropdown.
   */
  StockExitForm.prototype.configureItem = function configureItem(row, item) {
    row.configure(item);

    row._quantity_available = item._quantity_available;

    // since we automatically select the first lot, we use set it as "used"
    this._pool.use(row.lot_uuid);

    this.validate();
  };

  /**
   * @param uuid
   * @function removeItem
   * @description
   * This method removes an item from the ui-grid by its uuid.
   */
  StockExitForm.prototype.removeItem = function removeItem(uuid) {
    const lot = this.store.get(uuid);
    this.store.remove(uuid);

    // return the lot to the pool
    this._pool.release(lot.lot_uuid);

    this.validate();
  };

  /**
   * @function clear
   * @description
   * This method clears the entire grid, removing all items from the grid.
   */
  StockExitForm.prototype.clear = function clear() {
    // cache the current depot
    const { depot } = this;

    this.store.clear();
    this._pool.available.clear();
    this._pool.unavailable.clear();
    this._queriesInProgress = 0;
    this._messages.clear();

    $timeout(() => {
      this.setup();

      // reset the depot and load stock
      this.setDepot(depot);
    });
  };

  /**
   * @function writeCache
   * @description
   * This method writes values from the movement into the application cache for
   * later recovery.
   */
  StockExitForm.prototype.writeCache = function writeCache() {
    this.cache.details = this.details;
    this.cache.items = angular.copy(this.store.data);
  };

  /**
   * @function clearCache
   * @description
   * This method deletes the items from the application cache.
   */
  StockExitForm.prototype.clearCache = function clearCache() {
    delete this.cache.details;
    delete this.cache.items;
  };

  /**
   * @function hasCacheAvailable
   * @description
   * Checks to see if the invoice has cached items to recover.
   */
  StockExitForm.prototype.hasCacheAvailable = function hasCacheAvailable() {
    return Object.keys(this.cache).length > 0;
  };

  /**
   * @function validate
   * @description
   * Check if the form is valid or contains errors.  This is done by:
   *
   * 1. TODO(@jniles) - check if all data is finished loading
   * 2. Running the validate function on each stock item.
   * 3. Checking if globally required items (date, etc) are set.
   * @returns boolean
   */
  StockExitForm.prototype.validate = function validate() {

    // checks the form details
    const hasRequiredDetails = this.details.depot_uuid
      && this.details.date
      && this.details.exit_type;

    // these two conditions require special logic
    const hasNoDestination = !this.details.entity_uuid;

    // to ensure we validate the entire grid, we must do a pass first, then
    // check Array.prototype.every()
    const validation = this.store.data.map(lot => lot.validate(this.details.date, !this._isStockLoss()));

    // check for valid lots
    const hasValidLots = this.store.data.length > 0
      && validation.every(row => row);

    // gather errors into a flat array
    const errors = this.store.data
      .flatMap(row => row.errors())
      .filter(err => err);

    // indicate that the grid has errors in it
    this._toggleInfoMessage(errors.length > 0, 'error', ERR_LOT_ERRORS, errors);

    // some exit types require a destination (patient, service, depot).
    const hasDestinationError = this.details.exit_type && !this._isStockLoss() && hasNoDestination;
    this._toggleInfoMessage(hasDestinationError, 'error', ERR_NO_DESTINATION, this.details);

    // display a message telling the user to add lots next
    const showNeedsLotsInfoMessage = this.details.exit_type
      && !hasDestinationError
      && this.store.data.length === 0;

    if (this.exitTypePredefined) {
      this._toggleInfoMessage(showNeedsLotsInfoMessage, 'info', INFO_NEEDS_LOTS, this.details);
    } else {
      this._toggleInfoMessage(showNeedsLotsInfoMessage, 'info', INFO_EXIT_TYPE_SET_NEEDS_LOTS, this.details);
    }

    // remove the barcode error next validation
    this._toggleInfoMessage(false, 'error', ERR_NO_BARCODE_MATCH_IN_DEPOT);

    return !!hasRequiredDetails
      && hasValidLots
      && !hasDestinationError;
  };

  /**
   * @function getDataForSubmission
   * @description
   * This method returns the "stock movement object" needed by the stock exit form to submit data.
   */
  StockExitForm.prototype.getDataForSubmission = function getDataForSubmission() {
    const data = { ...this.details };

    return Helpers.getDescription(this.depot, data)
      .then(description => {
        Object.assign(data, { description });

        // format the lots for submission
        data.lots = this.store.data
          .map(lot => ({
            uuid : lot.lot_uuid,
            inventory_uuid : lot.inventory_uuid,
            quantity : lot.quantity,
          }));

        return data;
      });
  };

  /**
   * @function submit
   * @description
   * Submits the values to the server.
   */
  StockExitForm.prototype.submit = function submit() {
    return this.getDataForSubmission()
      .then(data => {
        return Stock.movements.create(data);
      });
  };

  /**
   * @param rows
   * @function formatForExport
   * @description
   * Formats the grid rows for export.
   */
  StockExitForm.prototype.formatRowsForExport = function formatRows(rows = []) {
    return rows.map(row => row.formatForExport());
  };

  return StockExitForm;
}
