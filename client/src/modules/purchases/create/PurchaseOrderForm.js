angular.module('bhima.services')
  .service('PurchaseOrderForm', PurchaseOrderFormService);

PurchaseOrderFormService.$inject = [
  'InventoryService', 'AppCache', 'Store', 'Pool', 'PurchaseOrderItemService', '$q',
  'uuid', 'SessionService',
];

/**
 * @class PurchaseOrderForm
 *
 * @description
 * The PurchaseOrderForm class manages the totalling, caching, and validation
 * associated with purchase order creation.  The developer must specify a cacheKey
 * to enable the class to be instantiated correctly.
 */
function PurchaseOrderFormService(Inventory, AppCache, Store, Pool, PurchaseOrderItem, $q, uuid, Session) {
  /**
   * @constructor
   *
   * @description
   * This function constructs a new instance of the PurchaseOrderForm class.
   *
   * @param {String} cacheKey - the AppCache key under which to store the
   *   order.
   */
  function PurchaseOrderForm(cacheKey) {
    if (!cacheKey) {
      throw new Error('PurchaseOrderForm expected a cacheKey, but it was not provided.');
    }

    // bind the cache key
    this.cache = AppCache(cacheKey);

    // Save a default for the current exchange rate
    this.currentExchangeRate = 1.0;

    // set up the inventory
    // this will be referred to as PurchaseOrderForm.inventory.available.data
    this.inventory = new Pool({ identifier : 'uuid', data : [] });

    this._ready = $q.defer();

    // set up the inventory
    Inventory.read(null, { locked : 0, skipTags : true })
      .then((data) => {

        // zero out price so that users don't automatically use the sale price.
        data.forEach(row => {
          row.price = 0;
        });

        this.inventory.initialize('uuid', data);

        // FIXME(@jniles) - this is a hack. We should actually put a list() method on the
        // PoolService to get all data out of it.
        this.inventory._data = angular.copy(data);
      })
      .finally(() => {
        this._ready.resolve();
      });

    // setup the rows of the grid as a store
    // this will be referred to as PurchaseOrderForm.store.data
    this.store = new Store({ identifier : 'uuid', data : [] });

    this.setup();
  }

  /**
   * @function ready
   *
   * @description
   * This provides a deferred promise that is only fulfilled when the
   * data that requires loading is fulfilled.
   */
  PurchaseOrderForm.prototype.ready = function ready() {
    return this._ready.promise;
  };

  /**
   * @method setupFromPreviousPurchaseOrder
   *
   * @description
   *
   */
  PurchaseOrderForm.prototype.setupFromPreviousPurchaseOrder = function setupFromPreviousPurchaseOrder(order) {
    // clear previous data
    this.setup();

    this.details.uuid = uuid();
    this.details.date = new Date(order.date);
    this.details.cost = order.cost;
    this.details.shipping_handling = order.shipping_handling;
    this.details.currency_id = order.currency_id;
    this.details.note = order.note;
    this.details.supplier_uuid = order.supplier_uuid;
    this.details.requested_by = order.requested_by;
    this.details.reviewed_by = order.reviewed_by;
    this.details.approved_by = order.approved_by;

    this.details.info_purchase_number = order.info_purchase_number;
    this.details.info_prf_number = order.info_prf_number;
    this.details.info_contact_name = order.info_contact_name;
    this.details.info_contact_phone = order.info_contact_phone;
    this.details.info_contact_title = order.info_contact_title;
    this.details.info_delivery_location = order.info_delivery_location;
    this.details.info_delivery_date = order.info_delivery_date;
    this.details.info_delivery_condition = order.info_delivery_condition;
    this.details.info_special_instruction = order.info_special_instruction;
    this.details.info_payment_condition = order.info_payment_condition;

    // TODO(@jniles) - what do we do about user_id?  Should we
    // modify it?  Keep a table of modifications to purchase orders?
    // NOTE(@jniles) - Vanga would like to see who modified the purchase orders.

    // make sure we have our inventory loaded before applying the old order prices.
    return this.ready().then(() => {

      // add the expected number of items
      order.items.forEach((prev) => {

        // make the item uuids match between the previous and current records
        const current = this.addItem();
        current.uuid = prev.uuid;

        // get the inventory item to configure this row
        const inventory = this.inventory.available.get(prev.inventory_uuid);
        current.configure(inventory);

        current.quantity = prev.quantity;
        current.unit_price = prev.unit_price;
        current.package_size = prev.package_size;
      });

      // update the store's uuid -> object mapping since we
      // changed the uuid primary key in the above loop
      this.store.recalculateIndex();

      this.validate();
    });
  };

  // initial setup and clearing of the order
  PurchaseOrderForm.prototype.setup = function setup() {

    // the order details
    this.details = {
      payment_method : 'FORM.LABELS.ON_PURCHASE',
      date : new Date(),
      cost : 0,
      shipping_handling : 0,
      info_delivery_condition : Session.enterprise.settings.terms_of_delivery,
      info_special_instruction : Session.enterprise.settings.special_instructions,
    };

    // this object holds the totals for the order.
    this.totals = {
      rows : 0,
    };

    // remove all items from the store as needed
    this.clear();

    this._valid = false;
    this._invalid = true;

    // trigger a totals digest
    this.digest();
  };

  PurchaseOrderForm.prototype.onDateChange = function onDateChange(date) {
    this.details.date = date;
  };

  /**
   * @method validate
   *
   * @description
   * This method digests the order, then returns all invalid items in the
   * order to be dealt with by the user.
   */
  PurchaseOrderForm.prototype.validate = function validate() {
    this.digest();

    // filters out valid items
    const invalidItems = this.store.data.filter(row => row._invalid);

    // set global configuration error if missing accounts
    const hasGlobalError = this.store.data.some(row => !row._hasValidAccounts);
    this._hasGlobalError = hasGlobalError;

    this._invalid = invalidItems.length > 0;
    this._valid = !this._invalid;

    return invalidItems;
  };

  /**
   * @method setSupplier
   *
   * @description
   * This allows the supplier to be cached locally and hooks up the creditor
   * uuid to the details form.
   *
   * @param {Object} supplier- a supplier selected by the purchasing
   *   module's typeahead
   */
  PurchaseOrderForm.prototype.setSupplier = function setSupplier(supplier) {
    const order = this;
    // attach the creditor uuid to the request
    order.details.supplier_uuid = supplier.uuid;
    order.details.info_contact_name = supplier.contact_name;
    order.details.info_contact_title = supplier.contact_title;
    order.details.info_contact_phone = supplier.contact_phone;

    // add a single item to the order to begin
    if (order.store.data.length === 0) {
      order.addItem();
    }

    // run validation and calculation
    order.digest();
  };

  /**
   * @method digest
   *
   * @description
   * Calculates the totals for the order by summing all the values in the grid.
   *
   * This method should be called anytime the values of the grid change, and on
   * setSupplier() completion.
   */
  PurchaseOrderForm.prototype.digest = function digest() {
    const order = this;
    const { totals } = order;

    // loop through the items summing them into a total
    totals.rows = order.store.data.reduce((value, unit) => {

      // compute validation
      unit.validate();

      // do not sum the row if the row is invalid
      if (unit._invalid) { return value; }
      unit.total = unit.unit_price * unit.quantity; // NB: In selected currency
      return unit.total + value;
    }, 0);

    // bind the total as as the total cost
    // order.details.cost = totals.rows + order.details.shipping_handling;
    order.details.cost = totals.rows;
  };

  // clears the store of items
  PurchaseOrderForm.prototype.clear = function clear() {
    const order = this;

    // copy the data so that forEach() doesn't get confused.
    const cp = angular.copy(order.store.data);

    // remove each item from the store
    cp.forEach((item) => {
      order.removeItem(item);
    });
  };

  /*
   * PurchaseOrderForm Item Methods
   */

  /**
   * @method addItems
   *
   * @description
   * Adds new purchase order items for each integer passed in.
   */
  PurchaseOrderForm.prototype.addItems = function addItems(n) {
    let i = n;
    while (i--) { this.addItem(); }
  };

  /**
   * @method addItem
   *
   * @description
   * Adds a new PurchaseOrderItem to the store.  If the inventory is all used
   * up, return silently.  This is so that we do not add rows that cannot be
   * configured with inventory items.
   */
  PurchaseOrderForm.prototype.addItem = function addItem() {

    // we cannot insert more rows than our max inventory size
    const maxRows = this.inventory.size();
    if (this.store.data.length >= maxRows) {
      return null;
    }

    // add the item to the store
    const item = new PurchaseOrderItem();
    this.store.post(item);

    // return a reference to the item
    return item;
  };

  /**
   * @method removeItem
   *
   * @description
   * Removes a specific item from the store. If the item has been configured,
   * also release the associated inventory item so that it may be used again.
   *
   * @param {Object} item - the item/row to be removed from the store
   */
  PurchaseOrderForm.prototype.removeItem = function removeItem(item) {
    this.store.remove(item.uuid);
    if (item.inventory_uuid) {
      this.inventory.release(item.inventory_uuid);
    }
  };

  /**
   * @method configureItem
   *
   * @description
   * New items still need to be configured with references to the inventory item
   * that is being orderd.  This method attaches the inventory_uuid to the
   * item, and removes the referenced inventory item from the pool.
   *
   * @param {Object} item - the item/row to be configured
   */
  PurchaseOrderForm.prototype.configureItem = function configureItem(item) {
    // remove the item from the pool
    const inventoryItem = this.inventory.use(item.inventory_uuid);

    // configure the PurchaseOrderFormItem with the inventory values
    item.configure(inventoryItem);

    // Inventory item prices are kept in the enterprise currency
    // Unit prices of items in an order are kept in the selected currency
    // so we need to fix the unit price.
    item.unit_price = inventoryItem.price * this.currentExchangeRate;

    // Look up the stats for this article of inventory
    Inventory.getInventoryUnitCosts(item.inventory_uuid)
      .then(({ stats }) => {
        // Save the stats for later checks
        item.stats = stats;
      });

    // make sure to validate and calculate new totals
    this.digest();
  };

  /**
   * @method setCurrencyId
   *
   * @description
   * Set the currency ID for this order
   *
   * @param {number} currencyId
   */
  PurchaseOrderForm.prototype.setCurrencyId = function setCurrencyId(currencyId) {
    this.details.currency_id = currencyId;
  };

  /**
   * @method setExchangeRate
   *
   * @description
   * Set the exchange rate for the current currency for all items
   *
   * @param {number} newExchangeRate
   */
  PurchaseOrderForm.prototype.setExchangeRate = function setExchangeRate(newExchangeRate) {
    this.currentExchangeRate = newExchangeRate;

    // Update unit prices for all order items
    this.store.data.forEach((item) => {
      if (!item._initialised) { return; }
      // We have no way to tell if this form is being invoked when creating
      // or editing a purchase, so do this work-around to get the inventory item
      const avItem = this.inventory.unavailable.get(item.inventory_uuid);
      const inventoryItem = avItem || this.inventory.available.get(item.inventory_uuid);
      item.unit_price = inventoryItem.price * this.currentExchangeRate;
    });

    this.digest();
  };

  /**
   * @method readCache
   *
   * @description
   * This method reads the values out of the application cache and into the
   * purchase order.  After reading the value, it re-digests the order to
   * perform validation and computer totals.
   */
  PurchaseOrderForm.prototype.readCache = function readCache() {

    // copy the cache temporarily
    const cp = angular.copy(this.cache);

    // set the details to the cached ones
    this.details = cp.details;

    // set the supplier
    this.setSupplier(cp.supplier);

    // setSupplier() adds an item.  Remove it before configuring data
    this.store.clear();

    // loop through the cached items, configuring them
    cp.items.forEach((cacheItem) => {
      const item = this.addItem();
      item.inventory_uuid = cacheItem.inventory_uuid;
      this.configureItem(item);
    });

    // digest validation and totals
    this.digest();
  };

  /**
   * @method writeCache
   *
   * @description
   * This method writes values from the order into the application cache for
   * later recovery.
   */
  PurchaseOrderForm.prototype.writeCache = function writeCache() {
    this.cache.details = this.details;
    this.cache.items = angular.copy(this.store.data);
  };

  /**
   * @method clearCache
   *
   * @description
   * This method deletes the items from the application cache.
   */
  PurchaseOrderForm.prototype.clearCache = function clearCache() {
    delete this.cache.details;
    delete this.cache.items;
  };

  /**
   * @method hasCacheAvailable
   *
   * @description
   * Checks to see if the order has cached items to recover.
   */
  PurchaseOrderForm.prototype.hasCacheAvailable = function hasCacheAvailable() {
    return Object.keys(this.cache).length > 0;
  };

  /**
   * @method hasSupplier
   *
   * @description
   * Just checks to see if the supplier is available.
   */
  PurchaseOrderForm.prototype.hasSupplier = function hasSupplier() {
    return angular.isDefined(this.details.supplier_uuid);
  };

  /**
   * @method formatOptimalPurchase
   *
   * This functions analyzses all inventory items and selects those that have reached a point of re-order,
   * then calculates the overall quantity ordered for each inventory.
   *
   * @param {Array} stock - the data of the inventories having reached their point of order
   */
  PurchaseOrderForm.prototype.formatOptimalPurchase = function formatOptimalPurchase(stock) {
    const rows = [];

    // grab inventory from Pool
    const inventories = this.inventory._data;

    inventories.forEach(inventory => {
      const row = new PurchaseOrderItem(inventory);
      row.quantity = 0;
      row._invalid = true;
      row._valid = false;

      stock.forEach(item => {
        if (item.inventory_uuid === row.inventory_uuid) {
          row.quantity += item.S_Q;
        }
      });

      rows.push(row);
    });

    console.log('rows:', rows);

    // sort by the inventory description
    return rows
      .filter(inventory => inventory.quantity > 0)
      .sort((a, b) => a.description.localeCompare(b.description));
  };

  return PurchaseOrderForm;
}
