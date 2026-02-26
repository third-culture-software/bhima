angular.module('bhima.services')
  .service('AssetsScansRegistryService', AssetsScansRegistryService);

AssetsScansRegistryService.$inject = [
  'SessionService', 'FilterService', 'appcache', 'bhConstants', 'PeriodService', 'util',
];

/**
 * This service encapsulates some common methods of assets scans registry
 * @param Session
 * @param Filters
 * @param AppCache
 * @param bhConstants
 * @param Periods
 * @param util
 */
function AssetsScansRegistryService(Session, Filters, AppCache, bhConstants, Periods, util) {
  const service = this;

  /**
   * Define the grid columns
   */
  service.columnDefs = [
    {
      field : 'depot_text',
      displayName : 'STOCK.DEPOT',
      headerTooltip : 'STOCK.DEPOT',
      headerCellFilter : 'translate',
    }, {
      field : 'group_name',
      displayName : 'TABLE.COLUMNS.INVENTORY_GROUP',
      headerTooltip : 'TABLE.COLUMNS.INVENTORY_GROUP',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
      visible : false,
    }, {
      field : 'inventory_code',
      displayName : 'STOCK.CODE',
      headerTooltip : 'STOCK.CODE',
      headerCellFilter : 'translate',
      visible : false,
    }, {
      field : 'inventory_text',
      displayName : 'STOCK.INVENTORY',
      headerTooltip : 'STOCK.INVENTORY',
      headerCellFilter : 'translate',
      visible : false,
    }, {
      field : 'manufacturer_brand',
      displayName : 'FORM.LABELS.MANUFACTURER_BRAND',
      headerTooltip : 'FORM.LABELS.MANUFACTURER_BRAND',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
    }, {
      field : 'manufacturer_model',
      displayName : 'FORM.LABELS.MANUFACTURER_MODEL',
      headerTooltip : 'FORM.LABELS.MANUFACTURER_MODEL',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
    }, {
      field : 'asset_label',
      displayName : 'ASSET.ASSET_LABEL',
      headerTooltip : 'ASSET.ASSET_LABEL_TOOLTIP',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
    }, {
      field : 'serial_number',
      displayName : 'TABLE.COLUMNS.SERIAL_NUMBER',
      headerTooltip : 'TABLE.COLUMNS.SERIAL_NUMBER',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
      visible : false,
    }, {
      field : 'reference_number',
      displayName : 'FORM.LABELS.REFERENCE_NUMBER',
      headerTooltip : 'FORM.LABELS.REFERENCE_NUMBER',
      headerCellClass : 'wrappingColHeader',
      headerCellFilter : 'translate',
      visible : false,
    }, {
      field : 'unit_cost',
      displayName : 'STOCK.UNIT_COST',
      headerTooltip : 'STOCK.UNIT_COST',
      cellClass : 'text-right',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
      type : 'number',
      cellFilter : 'currency: '.concat(Session.enterprise.currency_id),
      visible : false,
    }, {
      field : 'condition_label',
      displayName : 'ASSET.ASSET_CONDITION',
      headerTooltip : 'ASSET.ASSET_CONDITION',
      headerCellFilter : 'translate',
      cellFilter : 'translate',
    }, {
      field : 'notes',
      displayName : 'FORM.LABELS.NOTES',
      headerTooltip : 'FORM.LABELS.NOTES',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
    }, {
      field : 'scanned_by_name',
      displayName : 'ASSET.SCANNED_BY',
      headerTooltip : 'ASSET.SCANNED_BY',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
      visible : false,
    }, {
      field : 'created_at',
      type : 'date',
      displayName : 'ASSET.SCAN_DATE',
      headerTooltip : 'ASSET.SCAN_DATE',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
      cellFilter : 'date',
    }, {
      field : 'updated_at',
      type : 'date',
      displayName : 'FORM.LABELS.UPDATED',
      headerTooltip : 'FORM.LABELS.UPDATED',
      headerCellFilter : 'translate',
      cellFilter : 'date',
      visible : false,
    }, {
      field : 'assigned_to_name',
      displayName : 'ENTITY.ASSIGNED_TO',
      headerTooltip : 'ENTITY.ASSIGNED_TO',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
    }, {
      field : 'action',
      displayName : '',
      enableFiltering : false,
      enableSorting : false,
      cellTemplate : 'modules/asset_scans/templates/action.cell.html',
    },
  ];

  /**
   * Set up Asset scans filters for the asset scans registry
   */
  const scansFilters = new Filters();
  const filterCache = new AppCache('asset-scans-filters');

  service.filters = scansFilters;

  scansFilters.registerDefaultFilters(bhConstants.defaultFilters);

  scansFilters.registerCustomFilters([
    { key : 'uuid', label : 'FORM.LABELS.REFERENCE' },
    { key : 'asset_uuid', label : 'ASSET.ASSET' },
    { key : 'depot_uuid', label : 'STOCK.DEPOT' },
    { key : 'inventory_uuid', label : 'FORM.LABELS.INVENTORY' },
    { key : 'group_uuid', label : 'STOCK.INVENTORY_GROUP' },
    { key : 'assigned_to_uuid', label : 'ASSET.ASSIGNED_TO' },
    { key : 'reference_number', label : 'FORM.LABELS.REFERENCE_NUMBER' },
    { key : 'show_only_last_scans', label : 'ASSET.SHOW_ONLY_LAST_SCAN' },
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

    // assign default period filter
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
