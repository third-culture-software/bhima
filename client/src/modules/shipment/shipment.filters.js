angular.module('bhima.services')
  .service('ShipmentFilter', ShipmentFilterService);

ShipmentFilterService.$inject = [
  'FilterService', 'appcache', '$httpParamSerializer', 'LanguageService', 'bhConstants',
];

/**
 * @param Filters
 * @param AppCache
 * @param $httpParamSerializer
 * @param Languages
 * @param bhConstants
 * @class ShipmentFilterer
 * @todo
 * This kind of FilterService must be generalized to the entire client side app
 * Having just one big FilterService where we can just update `customFilterList`
 * or `DefaultFilterList`
 */
function ShipmentFilterService(Filters, AppCache, $httpParamSerializer, Languages, bhConstants) {
  const customFiltersList = [
    { key : 'depot_uuid', label : 'STOCK.DEPOT' },
    { key : 'origin_depot_uuid', label : 'SHIPMENT.ORIGIN_DEPOT' },
    { key : 'destination_depot_uuid', label : 'SHIPMENT.DESTINATION_DEPOT' },
    { key : 'ready_for_shipment', label : 'SHIPMENT.READY_TO_SHIP' },
    { key : 'barcode', label : 'BARCODE.BARCODE' },
    { key : 'reference', label : 'FORM.LABELS.REFERENCE' },
    { key : 'status', label : 'STOCK.STATUS.LABEL', valueFilter : 'translate' },
    { key : 'shipment_requisition_uuid', label : 'FORM.LABELS.REQUISITION_REFERENCE' },
    {
      key : 'dateFrom', label : 'FORM.LABELS.DATE', comparitor : '>', valueFilter : 'date',
    },
    {
      key : 'dateTo', label : 'FORM.LABELS.DATE', comparitor : '<', valueFilter : 'date',
    },
    {
      key : 'entry_date_from', label : 'STOCK.ENTRY_DATE', comparitor : '>', valueFilter : 'date',
    },
    {
      key : 'entry_date_to', label : 'STOCK.ENTRY_DATE', comparitor : '<', valueFilter : 'date',
    },
    {
      key : 'expiration_date_from', label : 'STOCK.EXPIRATION_DATE', comparitor : '>', valueFilter : 'date',
    },
    {
      key : 'expiration_date_to', label : 'STOCK.EXPIRATION_DATE', comparitor : '<', valueFilter : 'date',
    },
    { key : 'project_id', label : 'FORM.LABELS.PROJECT' },
  ];

  class ShipmentFilterer {
    constructor(cacheKey = 'shipment-filterer-cache') {
      this._filters = new Filters();
      this._cache = new AppCache(cacheKey);

      // register default filters
      this._filters.registerDefaultFilters(bhConstants.defaultFilters);

      // register custom filters
      this._filters.registerCustomFilters(customFiltersList);

      // load cached filters
      if (this._cache.filters) {
        this._filters.loadCache(this._cache.filters);
      }

      // assign default filters
      this.assignDefaultFilters();
    }

    get filters() { return this._filters; }

    get cache() { return this._cache; }

    // remove a filter by its key
    remove(valueKey) {
      this._filters.resetFilterState(valueKey);
    }

    // filter display value map
    getDisplayValueMap() {
      return this._filters.getDisplayValueMap();
    }

    // format http
    formatHTTP(format = false) {
      return this._filters.formatHTTP(format);
    }

    // format view
    formatView() {
      return this._filters.formatView();
    }

    // format cache
    formatCache() {
      this._cache.filters = this._filters.formatCache();
    }

    // replace filters
    replaceFilters(changes) {
      this._filters.replaceFilters(changes);
    }

    // replace filters from state
    replaceFiltersFromState(changes) {
      this._filters.replaceFiltersFromState(changes);
    }

    // load cached filters
    loadCachedFilters() {
      this._filters.loadCache(this._cache.filters || {});
    }

    /**
     * @function getQueryString
     * @description
     * returns a query string with parameters with the consideration
     * of the current applied filters
     * @param {string} type
     */
    getQueryString(type) {
      const filterOpts = this._filters.formatHTTP();
      const defaultOpts = { renderer : type, lang : Languages.key };

      // combine options
      const options = angular.merge(defaultOpts, filterOpts);

      // return  serialized options
      return $httpParamSerializer(options);
    }

    assignDefaultFilters() {
      // get the keys of filters already assigned - on initial load this will be empty
      const assignedKeys = Object.keys(this._filters.formatHTTP());

      // assign default limit filter
      if (assignedKeys.indexOf('limit') === -1) {
        this._filters.assignFilter('limit', 100);
      }
    }

    assignFilter(key, value) {
      const assignedKeys = Object.keys(this._filters.formatHTTP());
      if (assignedKeys.indexOf(value) === -1) {
        this._filters.assignFilter(key, value);
      }
    }
  }

  return ShipmentFilterer;
}
