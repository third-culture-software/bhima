angular.module('bhima.services')
  .service('StockService', StockService);

StockService.$inject = [
  'PrototypeApiService', 'StockFilterer', 'HttpCacheService', 'util', 'PeriodService',
];

/**
 *
 * @param Api
 * @param StockFilterer
 * @param HttpCache
 * @param util
 * @param Periods
 */
function StockService(Api, StockFilterer, HttpCache, util, Periods) {
  // API for stock lots
  const stocks = new Api('/stock/lots');

  // API for stock lots in depots
  const lots = new Api('/stock/lots/depots');

  // API for stock lots in depots With detailed information
  const lotsDetailed = new Api('/stock/lots/depotsDetailed');

  // API for assets
  const assets = new Api('/stock/assets');

  // API for stock lots movements
  const movements = new Api('/stock/lots/movements/');

  // API for stock lots movements
  const inlineMovements = new Api('/stock/movements/');

  const status = new Api('/stock/status');

  // API for stock inventory in depots
  const inventories = new Api('/stock/inventories/depots');

  // API for stock shipment
  const shipment = new Api('/stock/shipment');

  // the stock inventories route gets hit a lot.  Cache the results on the client.
  inventories.read = cacheInventoriesRead;

  const callback = (uuid, options) => Api.read.call(inventories, uuid, options);
  const fetcher = HttpCache(callback, 5000);

  /**
   * The read() method loads data from the api endpoint. If an id is provided,
   * the $http promise is resolved with a single JSON object, otherwise an array
   * of objects should be expected.
   @param {string} uuid - the uuid of the inventory to fetch (optional).
   * @param {object} options - options to be passed as query strings (optional).
   * @param {boolean} cacheBust - ignore the cache and send the HTTP request directly
   *   to the server.
   * @returns {Promise} promise - resolves to either a JSON (if id provided) or
   *   an array of JSONs.
   */
  function cacheInventoriesRead(uuid, options, cacheBust = false) {
    return fetcher(uuid, options, cacheBust);
  }

  // API for stock inventory adjustment
  const inventoryAdjustment = new Api('/stock/inventory_adjustment');

  // API for stock integration
  const integration = new Api('/stock/integration');

  // API for stock transfer
  const transfers = new Api('/stock/transfers');

  // API for stock import
  const importing = new Api('/stock/import');

  // API for stock assignment
  const stockAssign = new Api('/stock/assign/');

  // API for stock requisition
  const stockRequisition = new Api('/stock/requisition/');

  // API for stock requisition
  const stockRequestorType = new Api('/stock/requestor_type/');

  // API for stock Aggregated Consumption
  const aggregatedConsumption = new Api('/stock/aggregated_consumption');

  // Overide the stock assign api
  stockAssign.remove = uuid => {
    return stockAssign.$http.put(`/stock/assign/${uuid}/remove`)
      .then(stockAssign.util.unwrapHttpResponse);
  };

  // stock status label keys
  const stockStatusLabelKeys = {
    stock_out         : 'STOCK.STATUS.STOCK_OUT',
    in_stock          : 'STOCK.STATUS.IN_STOCK',
    security_reached  : 'STOCK.STATUS.SECURITY',
    minimum_reached   : 'STOCK.STATUS.MINIMUM',
    over_maximum      : 'STOCK.STATUS.OVER_MAX',
    unused_stock      : 'STOCK.STATUS.UNUSED_STOCK',
  };

  // Filter service
  const StockLotFilters = new StockFilterer('stock-lot-filters');
  const StockAssignFilters = new StockFilterer('stock-assign-filters');
  const StockRequisitionFilters = new StockFilterer('stock-requisition-filters');
  const StockMovementFilters = new StockFilterer('stock-inline-movement-filters');
  const StockInventoryFilters = new StockFilterer('stock-inventory-filters');
  const StockDepotFilters = new StockFilterer('stock-depot-filters');

  // creating an object of filter to avoid method duplication
  const stockFilter = {
    lot : StockLotFilters,
    stockAssign : StockAssignFilters,
    movements : StockMovementFilters,
    inventory : StockInventoryFilters,
    depot : StockDepotFilters,
    requisition : StockRequisitionFilters,
  };

  /**
   *
   * @param filterService
   */
  function assignDefaultPeriodFilters(filterService) {
    // get the keys of filters already assigned - on initial load this will be empty
    const assignedKeys = Object.keys(filterService._filters.formatHTTP());

    // assign default period filter
    const periodDefined = util.arrayIncludes(assignedKeys, [
      'period', 'custom_period_start', 'custom_period_end',
    ]);

    if (!periodDefined) {
      filterService._filters.assignFilters(Periods.defaultFilters());
    }
  }

  // assign default period filter to inlineStockMovements
  assignDefaultPeriodFilters(stockFilter.movements);

  /**
   *
   * @param service
   */
  function assignNoEmptyLotsDefaultFilter(service) {
    // add in the default key for the stock lots filter
    const assignedKeys = Object.keys(service._filters.formatHTTP());
    // assign default includeEmptyLot filter
    if (assignedKeys.indexOf('includeEmptyLot') === -1) {
      service._filters.assignFilter('includeEmptyLot', 0);
    }
  }

  // assign non empty lots filter to the stockLots Filterer
  assignNoEmptyLotsDefaultFilter(stockFilter.lot);

  /**
   *
   * @param service
   */
  function assignPendingTransfers(service) {
    // add in the default key for the stock lots filter
    const assignedKeys = Object.keys(service._filters.formatHTTP());
    // assign default Pending Transfers filter
    if (assignedKeys.indexOf('showPendingTransfers') === -1) {
      service._filters.assignFilter('showPendingTransfers', 0);
    }
  }

  // assign Pending Transfers filter to the stockLots Filterer
  assignPendingTransfers(stockFilter.movements);

  // uniformSelectedEntity function implementation
  // change name, text and display_nam into displayName
  /**
   *
   * @param entity
   */
  function uniformSelectedEntity(entity) {
    if (!entity) {
      return {};
    }

    const keys = ['name', 'text', 'display_name'];

    keys.forEach((key) => {
      if (entity[key]) {
        entity.displayName = entity[key];
      }
    });

    return {
      uuid : entity.uuid || '',
      reference : entity.reference || '',
      displayName : entity.displayName || '',
    };
  }

  /**
   * Filter partial transfers to compute adjusted quantities
   * @param {list} allTransfers
   * @returns {list} list of stock exits with adjusted quantities
   *
   * NOTE: This function may return an empty list.  It is up to the
   *       caller to handle error messages when that happens.
   */
  function filterPartialTransfers(allTransfers) {
    // we need to adjust the quantities appropriately.
    const exitTransfers = allTransfers.filter(item => item.is_exit);
    exitTransfers.forEach(item => {
      const previousTransfers = allTransfers.filter(trn => !trn.is_exit && trn.uuid === item.uuid);
      if (previousTransfers.length > 0) {
        previousTransfers.forEach(pt => {
          item.quantity -= pt.quantity;
        });
      }
    });
    return exitTransfers.filter(item => item.quantity > 0);
  }

  /**
   * @param data
   * @function processLotsFromStore
   * @description
   * This function loops through the store's contents mapping them into a flat
   * array of lots.
   * @returns {Array} - lots in an array.
   */
  function processLotsFromStore(data) {
    return data.reduce((current, line) => {
      return line.lots.map((lot) => {
        return {
          uuid : lot.uuid || null,
          label : lot.lot,
          quantity : lot.quantity,
          unit_cost : line.unit_cost,
          expiration_date : lot.expiration_date,
          inventory_uuid : line.inventory_uuid,
          description : lot.description || '',
          reference_number : lot.reference_number,
          serial_number : lot.serial_number,
          acquisition_date : lot.acquisition_date,
          package_size : lot.package_size,
        };
      }).concat(current);
    }, []);
  }

  /**
   * Get label for purchase Status
   * @param _status_
   */
  function statusLabelMap(_status_) {
    return stockStatusLabelKeys[_status_];
  }

  // download the template file
  /**
   *
   */
  function downloadTemplate() {
    const url = importing.url.concat('/template');
    return importing.$http.get(url)
      .then(response => {
        return importing.util.download(response, 'Import Stock Template', 'csv');
      });
  }

  assets.getAssetLots = params => {
    return assets.$http.get('/stock/assetLots', { params })
      .then(util.unwrapHttpResponse);
  };

  inventories.loadAMCForInventory = function loadAMCForInventory(inventoryUuid, depotUuid) {
    return inventories.$http.get(`/depots/${depotUuid}/inventories/${inventoryUuid}/cmm`)
      .then(util.unwrapHttpResponse);
  };

  // shipment in-transit inventory list
  shipment.getInTransitInventories = query => {
    return shipment.$http.get('/stock/shipment/transit', { params : query })
      .then(util.unwrapHttpResponse);
  };

  return {
    stocks,
    stockAssign,
    stockRequisition,
    stockRequestorType,
    inventoryAdjustment,
    lots,
    lotsDetailed,
    assets,
    movements,
    inlineMovements,
    inventories,
    integration,
    transfers,
    filter : stockFilter,
    filterPartialTransfers,
    uniformSelectedEntity,
    processLotsFromStore,
    statusLabelMap,
    downloadTemplate,
    status,
    stockStatusLabelKeys,
    aggregatedConsumption,
    shipment,
  };
}
