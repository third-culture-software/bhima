angular.module('bhima.services')
  .service('RequiredInventoryScansRegistryService', RequiredInventoryScansRegistryService);

RequiredInventoryScansRegistryService.$inject = [
  'FilterService', 'PeriodService', 'appcache', 'bhConstants', 'util',
];

/**
 * This service encapsulates some common methods of assets scans registry
 * @param Filters
 * @param Periods
 * @param AppCache
 * @param bhConstants
 * @param util
 */
function RequiredInventoryScansRegistryService(Filters, Periods, AppCache, bhConstants, util) {
  const service = this;

  /**
   * Define the grid columns
   */
  service.columnDefs = [
    {
      field : 'title',
      displayName : 'TABLE.COLUMNS.TITLE',
      headerTooltip : 'TABLE.COLUMNS.TITLE',
      headerCellFilter : 'translate',
    }, {
      field : 'description',
      displayName : 'TABLE.COLUMNS.DESCRIPTION',
      headerTooltip : 'TABLE.COLUMNS.DESCRIPTION',
      headerCellFilter : 'translate',
      visible : false,
    }, {
      field : 'start_date',
      type : 'date',
      displayName : 'ASSET.SCANS_START_DATE',
      headerTooltip : 'ASSET.SCANS_START_DATE',
      headerCellFilter : 'translate',
      cellFilter : 'date',
    }, {
      field : 'end_date',
      type : 'date',
      displayName : 'ASSET.SCANS_END_DATE',
      headerTooltip : 'ASSET.SCANS_END_DATE',
      headerCellFilter : 'translate',
      cellFilter : 'date',
    }, {
      field : 'depot_name',
      displayName : 'STOCK.DEPOT',
      headerTooltip : 'STOCK.DEPOT',
      headerCellFilter : 'translate',
    }, {
      field : 'is_asset',
      displayName : 'FORM.LABELS.ASSETS_ONLY',
      headerTooltip : 'FORM.LABELS.ASSETS_ONLY',
      headerCellFilter : 'translate',
      cellTemplate : '/modules/inventory/list/templates/asset.cell.tmpl.html',
      visible : false,
    }, {
      field : 'reference_number',
      displayName : 'FORM.LABELS.REFERENCE_NUMBER',
      headerTooltip : 'FORM.LABELS.REFERENCE_NUMBER',
      headerCellClass : 'wrappingColHeader',
      headerCellFilter : 'translate',
    }, {
      field : 'created_at',
      type : 'date',
      displayName : 'FORM.LABELS.SERVER_DATE',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
      cellTemplate : 'modules/journal/templates/created_at.cell.html',
      visible : false,
    }, {
      field : 'updated_at',
      displayName : 'FORM.LABELS.UPDATED',
      headerTooltip : 'FORM.LABELS.UPDATED',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
      cellFilter : 'date',
    }, {
      field : 'action',
      displayName : '',
      enableFiltering : false,
      enableSorting : false,
      cellTemplate : 'modules/required_inventory_scans/templates/action.cell.html',
    },
  ];

  /**
   * Set up Asset scans filters for the asset scans registry
   */
  const scansFilters = new Filters();
  const filterCache = new AppCache('required-inventory-scans-filters');

  service.filters = scansFilters;

  scansFilters.registerDefaultFilters(bhConstants.defaultFilters);

  scansFilters.registerCustomFilters([
    { key : 'uuid', label : 'FORM.LABELS.REFERENCE' },
    { key : 'depot_uuid', label : 'STOCK.DEPOT' },
    { key : 'reference_number', label : 'FORM.LABELS.REFERENCE_NUMBER' },
  ]);

  if (filterCache.filters) {
    scansFilters.loadCache(filterCache.filters);
  }

  // once the cache has been loaded - ensure that default filters are provided appropriate values
  assignDefaultFilters();

  /**
   *
   */
  function assignDefaultFilters() {
    // get the keys of filters already assigned - on initial load this will be empty
    const assignedKeys = Object.keys(scansFilters.formatHTTP());

    // assign default limit filter
    if (assignedKeys.indexOf('limit') === -1) {
      scansFilters.assignFilter('limit', 100);
    }

    // assign default period filter (for the end date of the inventory scan)
    const periodKeys = ['period', 'custom_period_start', 'custom_period_end'];
    const periodDefined = util.arrayIncludes(assignedKeys, periodKeys);

    if (!periodDefined) {
      scansFilters.assignFilters(Periods.defaultFilters());
      // Force the default period to be this year
      scansFilters.assignFilter('period', 'year', 'PERIODS.THIS_YEAR');
    }
  }

  // Remove a filter
  service.filters.removeFilter = function removeFilter(key) {
    scansFilters.resetFilterState(key);
  };

  // load filters from cache
  service.filters.cacheFilters = function cacheFilters() {
    filterCache.filters = scansFilters.formatCache();
  };
  service.filters.loadCachedFilters = function loadCachedFilters() {
    scansFilters.loadCache(filterCache.filters || {});
  };

}
