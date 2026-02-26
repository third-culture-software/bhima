angular.module('bhima.services')
  .service('PurchaseOrderService', PurchaseOrderService);

PurchaseOrderService.$inject = [
  '$uibModal', 'FilterService', 'appcache', 'PeriodService',
  'PrototypeApiService', '$httpParamSerializer', 'LanguageService',
  'bhConstants', 'SessionService',
];

/**
 * @param $uibModal
 * @param Filters
 * @param AppCache
 * @param Periods
 * @param Api
 * @param $httpParamSerializer
 * @param Languages
 * @param bhConstants
 * @param Session
 * @class PurchaseOrderService
 * @augments PrototypeApiService
 * @description
 * Connects client controllers with the purchase order backend.
 */
function PurchaseOrderService(
  $uibModal,
  Filters,
  AppCache,
  Periods,
  Api,
  $httpParamSerializer,
  Languages,
  bhConstants,
  Session,
) {
  const baseUrl = '/purchases/';
  const service = new Api(baseUrl);

  const purchaseFilters = new Filters();
  const filterCache = new AppCache('purchases-filters');

  service.filters = purchaseFilters;
  service.openSearchModal = openSearchModal;

  // document exposition definition
  service.download = download;

  // bind public methods to the instance
  service.create = create;
  service.stockStatus = stockStatus;
  service.stockBalance = stockBalance;
  service.purchaseState = purchaseState;

  service.openPurchaseOrderAnalysisReport = openPurchaseOrderAnalysisReport;

  service.getPurchaseDetailed = getPurchaseDetailed;

  // loads get purchases detailed
  /**
   *
   * @param options
   */
  function getPurchaseDetailed(options) {
    const url = ''.concat('detailed');
    return Api.read.call(service, url, options);
  }

  purchaseFilters.registerDefaultFilters(bhConstants.defaultFilters);

  purchaseFilters.registerCustomFilters([
    { key : 'uuid', label : 'FORM.LABELS.REFERENCE' },
    { key : 'reference', label : 'FORM.LABELS.REFERENCE' },
    { key : 'user_id', label : 'FORM.LABELS.USER' },
    { key : 'supplier_uuid', label : 'FORM.LABELS.SUPPLIER' },
    { key : 'inventory_uuid', label : 'FORM.LABELS.INVENTORY' },
    { key : 'status_id', label : 'PURCHASES.ORDER' },
    { key : 'defaultPeriod', label : 'TABLE.COLUMNS.PERIOD', ngFilter : 'translate' },
    { key : 'responsible', label : 'FORM.LABELS.RESPONSIBLE' },
    { key : 'info_purchase_number', label : 'PURCHASES.INFO.PURCHASE_NUMBER' },
    { key : 'info_prf_number', label : 'PURCHASES.INFO.PRF_NUMBER' },
  ]);

  if (filterCache.filters) {
    purchaseFilters.loadCache(filterCache.filters);
  }

  // once the cache has been loaded - ensure that default filters are provided appropriate values
  assignDefaultFilters();

  /**
   *
   */
  function assignDefaultFilters() {
    // get the keys of filters already assigned - on initial load this will be empty
    const assignedKeys = Object.keys(purchaseFilters.formatHTTP());

    const includes = service.util.arrayIncludes;

    // assign default period filter
    const periodDefined = includes(assignedKeys, ['period', 'custom_period_start', 'custom_period_end']);

    if (!periodDefined) {
      purchaseFilters.assignFilters(Periods.defaultFilters());
    }

    // assign default limit filter
    if (assignedKeys.indexOf('limit') === -1) {
      purchaseFilters.assignFilter('limit', 100);
    }
  }

  service.removeFilter = function removeFilter(key) {
    purchaseFilters.resetFilterState(key);
  };

  // load filters from cache
  service.cacheFilters = function cacheFilters() {
    filterCache.filters = purchaseFilters.formatCache();
  };

  service.loadCachedFilters = function loadCachedFilters() {
    purchaseFilters.loadCache(filterCache.filters || {});
  };

  /**
   * @param data
   * @function create
   * @description
   * Preprocesses purchase order data for submission to the server
   */
  function create(data) {
    return Api.create.call(service, data);
  }

  service.preprocessItemsForSubmission = function preprocessItemsForSubmission(items) {
    // loop through the items ensuring that they are properly formatted for
    // inserting into the database.  We only want to send minimal information
    // to the server.
    // Technically, this filtering is also done on the server, but this reduces
    // bandwidth required for the POST request.
    return items.map((item) => {
      delete item.code;
      delete item.description;
      delete item.unit_type;
      delete item._hasValidAccounts;
      delete item._initialised;
      delete item._invalid;
      delete item._valid;
      return item;
    });
  };

  /**
   *
   * @param id
   */
  function stockStatus(id) {
    const url = ''.concat(id, '/stock_status');
    return Api.read.call(service, url);
  }

  /**
   *
   * @param id
   */
  function stockBalance(id) {
    const url = ''.concat(id, '/stock_balance');
    return Api.read.call(service, url);
  }

  /**
   *
   */
  function purchaseState() {
    const url = ''.concat('purchaseState');
    return Api.read.call(service, url);
  }

  /**
   * @function openSearchModal
   * @param {object} params - an object of filter parameters to be passed to
   *   the modal.
   * @returns {Promise} modalInstance
   */
  function openSearchModal(params) {
    return $uibModal.open({
      templateUrl : 'modules/purchases/modals/search.tmpl.html',
      controller : 'SearchPurchaseOrderModalController as $ctrl',
      resolve : {
        params : () => params,
      },
    }).result;
  }

  /**
   *
   * @param row
   */
  function openPurchaseOrderAnalysisReport(row) {
    const opts = {
      lang : Languages.key,
      currency_id : Session.enterprise.currency_id,
      purchase_uuid : row.uuid,
      shouldShowDetails : 1,
      renderer : 'pdf',
    };

    return $httpParamSerializer(opts);
  }

  /**
   *
   * @param type
   */
  function download(type) {
    const filterOpts = purchaseFilters.formatHTTP();
    const defaultOpts = { renderer : type, lang : Languages.key };

    // combine options
    const options = angular.merge(defaultOpts, filterOpts);

    // return  serialized options
    return $httpParamSerializer(options);
  }

  return service;
}
