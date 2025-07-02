angular.module('bhima.services')
  .service('GridFilterer', GridFiltererService);

GridFiltererService.$inject = [
  'FilterService', 'appcache', 'PeriodService',
  'bhConstants', 'util', 'NotifyService',
];

/**
 * @class GridFilterer
 */
function GridFiltererService(
  Filters, AppCache, Periods,
  bhConstants, Util, Notify,
) {
  const customFiltersList = [
    { key : 'display_name', label : 'FORM.LABELS.NAME' },
    { key : 'sex', label : 'FORM.LABELS.GENDER' },
    { key : 'hospital_no', label : 'FORM.LABELS.HOSPITAL_NO' },
    { key : 'depot_uuid', label : 'STOCK.DEPOT' },
    { key : 'inventory_uuid', label : 'STOCK.INVENTORY' },
    { key : 'group_uuid', label : 'STOCK.INVENTORY_GROUP' },
    { key : 'label', label : 'FORM.LABELS.LABEL' },
    { key : 'is_exit', label : 'STOCK.OUTPUT' },
    { key : 'reference', label : 'FORM.LABELS.REFERENCE' },
    { key : 'flux_id', label : 'STOCK.FLUX' },
    { key : 'user_id', label : 'FORM.LABELS.USER' },
    { key : 'status', label : 'STOCK.STATUS.LABEL', valueFilter : 'translate' },
    { key : 'require_po', label : 'STOCK.REQUIRES_PO' },
    { key : 'entity_uuid', label : 'ENTITY.LABEL' },
    { key : 'description', label : 'FORM.LABELS.DESCRIPTION' },
    { key : 'includeEmptyLot', label : 'LOTS.INCLUDE_EXHAUSTED_LOTS' },
    { key : 'debtor_group_uuid', label : 'FORM.LABELS.DEBTOR_GROUP' },
    { key : 'debtor_uuid', label : 'FORM.LABELS.PATIENT' },
    { key : 'patient_group_uuid', label : 'PATIENT_GROUP.PATIENT_GROUP' },
    { key : 'project_id', label : 'FORM.LABELS.PROJECT' },
    { key : 'defaultPeriod', label : 'TABLE.COLUMNS.PERIOD' },
    { key : 'originLocationLabel', label : 'FORM.LABELS.ORIGIN_LOCATION' },
    { key : 'ward_uuid', label : 'WARD.TITLE' },
    { key : 'room_uuid', label : 'ROOM.TITLE' },
    { key : 'bed_id', label : 'BED.TITLE' },
    { key : 'hospitalized', label : 'PATIENT_RECORDS.VISITS.HOSPITALISATION' },
    { key : 'service_uuid', label : 'FORM.LABELS.SERVICE' },
    { key : 'is_new_case', label : 'PATIENT_RECORDS.VISITS.CASE' },
    { key : 'is_pregnant', label : 'PATIENT_RECORDS.VISITS.PREGNANT' },
    { key : 'is_refered', label : 'PATIENT_RECORDS.VISITS.REFERED' },
    { key : 'inside_health_zone', label : 'PATIENT_RECORDS.VISITS.HEALTH_ZONE' },
    { key : 'type_id', label : 'DASHBOARD.INDICATORS_FILES.TYPE' },
    { key : 'status_id', label : 'DASHBOARD.INDICATORS_FILES.STATUS' },
    { key : 'fiscal_year_id', label : 'FORM.LABELS.FISCAL_YEAR' },
    { key : 'period_id', label : 'FORM.LABELS.PERIOD' },
    {
      key : 'dateFrom', label : 'FORM.LABELS.DATE', comparitor : '>', valueFilter : 'date',
    },
    {
      key : 'dateTo', label : 'FORM.LABELS.DATE', comparitor : '<', valueFilter : 'date',
    },
    {
      key : 'custom_date_start', label : 'FORM.LABELS.DATE', comparitor : '>', valueFilter : 'date',
    },
    {
      key : 'custom_date_end', label : 'FORM.LABELS.DATE', comparitor : '<', valueFilter : 'date',
    },
    {
      key : 'dateBirthFrom', label : 'FORM.LABELS.DOB', comparitor : '>', valueFilter : 'date',
    },
    {
      key : 'dateBirthTo', label : 'FORM.LABELS.DOB', comparitor : '<', valueFilter : 'date',
    },
    {
      key : 'dateRegistrationFrom', label : 'FORM.LABELS.DATE_REGISTRATION', comparitor : '>', valueFilter : 'date',
    },
    {
      key : 'dateRegistrationTo', label : 'FORM.LABELS.DATE_REGISTRATION', comparitor : '<', valueFilter : 'date',
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
  ];

  class GridFilterer {
    constructor(cacheKey, defaultFilters) {
      if (!cacheKey) {
        Notify.danger('FORM.LABELS.GRID_CACHE_KEY_MISSING');
        return;
      }

      this._filters = new Filters();
      this._cache = new AppCache(cacheKey);

      // register default filters
      this._filters.registerDefaultFilters(defaultFilters || bhConstants.defaultFilters);

      // register custom filters
      this._filters.registerCustomFilters(customFiltersList);

      // load cached filters
      if (this._cache.filters) {
        this._filters.loadCache(this._cache.filters);
      }

      // assign default filters
      this.assignDefaultFilters(defaultFilters);
    }

    get filters() { return this._filters; }

    get cache() { return this._cache; }

    // set custom filters
    setCustomFilters(filtersList) {
      this._filters.registerCustomFilters(filtersList);
    }

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

    assignDefaultFilters(defaultFilters) {
      // get the keys of filters already assigned - on initial load this will be empty
      const assignedKeys = Object.keys(this._filters.formatHTTP());

      // assign default period filter
      const periodDefined = assignedKeys.includes('period');

      if (!periodDefined && !defaultFilters) {
        this._filters.assignFilters(Periods.defaultFilters());
      }

      // assign default limit filter
      if (assignedKeys.indexOf('limit') === -1 && !defaultFilters) {
        this._filters.assignFilter('limit', 100);
      }

      if (defaultFilters && defaultFilters.length) {
        defaultFilters.forEach(filter => {
          this._filters.assignFilter(filter.key, filter.defaultValue);
        });
      }
    }
  }

  return GridFilterer;
}
