angular.module('bhima.controllers')
  .controller('StockInventoriesController', StockInventoriesController);

StockInventoriesController.$inject = [
  '$state', 'StockService', 'StockModalService', 'LanguageService', 'SessionService',
  'uiGridConstants', 'GridGroupingService', 'GridStateService', 'GridColumnService',
  'NotifyService', '$httpParamSerializer', 'BarcodeService', '$translate', 'bhConstants',
];

/**
 * Stock Inventory Controller
 * This module is a registry page for stock inventories
 * @param $state
 * @param Stock
 * @param StockModal
 * @param Languages
 * @param Session
 * @param uiGridConstants
 * @param Grouping
 * @param GridState
 * @param Columns
 * @param Notify
 * @param $httpParamSerializer
 * @param Barcode
 * @param $translate
 * @param bhConstants
 */
function StockInventoriesController(
  $state, Stock, StockModal, Languages, Session,
  uiGridConstants, Grouping, GridState, Columns,
  Notify, $httpParamSerializer, Barcode, $translate, bhConstants,
) {
  const vm = this;
  const cacheKey = 'stock-inventory-grid';
  const stockInventoryFilters = Stock.filter.inventory;

  vm.bhConstants = bhConstants;
  vm.openBarcodeScanner = openBarcodeScanner;
  vm.openStockSheetReport = openStockSheetReport;

  const displayEnableExpiredStockOut = (Session.stock_settings.enable_expired_stock_out) || false;

  const columns = [{
    field            : 'depot_text',
    displayName      : 'STOCK.DEPOT',
    headerCellFilter : 'translate',
    cellTemplate     : 'modules/stock/inventories/templates/depot.cell.html',
  }, {
    field            : 'code',
    displayName      : 'STOCK.CODE',
    headerCellFilter : 'translate',
  }, {
    field            : 'text',
    displayName      : 'STOCK.INVENTORY',
    headerCellFilter : 'translate',
    width            : '20%',
    cellTemplate     : 'modules/stock/inventories/templates/inventory.cell.html',
  }, {
    field            : 'group_name',
    displayName      : 'STOCK.INVENTORY_GROUP',
    headerCellFilter : 'translate',
  }, {
    field            : 'quantity',
    displayName      : 'STOCK.QUANTITY',
    headerCellFilter : 'translate',
    width            : '10%',
    cellClass        : 'text-right',
    type : 'number',
  }, {
    field            : 'usableAvailableStock',
    displayName      : 'STOCK.USABLE_AVAILABLE_STOCK',
    headerCellFilter : 'translate',
    width            : '10%',
    cellClass        : 'text-right',
    visible          : displayEnableExpiredStockOut,
    type : 'number',
  }, {
    field            : 'unit_type',
    width            : 75,
    displayName      : 'TABLE.COLUMNS.UNIT',
    headerCellFilter : 'translate',
    cellTemplate     : 'modules/stock/inventories/templates/unit.tmpl.html',
  }, {
    field            : 'has_risky_lots',
    displayName      : '',
    cellTemplate     : 'modules/stock/inventories/templates/warning.cell.html',
    width            : 50,
    enableFiltering  : false,
  }, {
    field            : 'status_translated',
    displayName      : 'STOCK.STATUS.LABEL',
    headerCellFilter : 'translate',
    cellTemplate     : 'modules/stock/inventories/templates/status.cell.html',
  }, {
    field            : 'avg_consumption',
    displayName      : 'STOCK.CMM',
    headerTooltip    : 'STOCK.MONTHLY_CONSUMPTION.AVERAGE_MONTHLY_CONSUMPTION',
    headerCellFilter : 'translate',
    enableFiltering  : false,
    enableSorting    : true,
    cellClass        : 'text-right',
    type             : 'number',
    cellTemplate     : 'modules/stock/inventories/templates/cmm.cell.html',
  }, {
    field           : 'S_SEC',
    displayName     : 'SS',
    headerCellFilter : 'translate',
    headerTooltip   : 'STOCK.SECURITY',
    enableFiltering : false,
    enableSorting   : false,
    cellClass       : 'text-right',
    type : 'number',
  }, {
    field           : 'S_MIN',
    displayName     : 'MIN',
    headerCellFilter : 'translate',
    headerTooltip   : 'STOCK.MINIMUM',
    enableFiltering : false,
    enableSorting   : false,
    cellClass       : 'text-right',
    type : 'number',
  }, {
    field           : 'S_MAX',
    displayName     : 'MAX',
    headerCellFilter : 'translate',
    headerTooltip   : 'STOCK.MAXIMUM',
    enableFiltering : false,
    enableSorting   : false,
    cellClass       : 'text-right',
    type : 'number',
  }, {
    field            : 'S_Q',
    displayName      : 'STOCK.ORDERS',
    headerTooltip    : 'STOCK.REFILL_QUANTITY',
    headerCellFilter : 'translate',
    enableFiltering  : false,
    enableSorting    : true,
    type             : 'number',
    cellClass        : 'text-right',
    cellTemplate     : 'modules/stock/inventories/templates/appro.cell.html',
  }, {
    field            : 'lifetime',
    displayName      : 'STOCK.DAYS_UNTIL_STOCK_OUT',
    headerTooltip    : 'STOCK.DAYS_UNTIL_STOCK_OUT',
    headerCellFilter : 'translate',
    type             : 'number',
    visible          : false,
  }, {
    field            : 'wac',
    displayName      : 'STOCK.WAC',
    headerTooltip    : 'STOCK.WAC',
    headerCellFilter : 'translate',
    cellFilter       : 'currency:grid.appScope.enterprise.currency_id:4',
    type             : 'number',
    visible          : false,
  }, {
    field            : 'action',
    displayName      : '',
    enableFiltering  : false,
    enableSorting    : false,
    cellTemplate     : 'modules/stock/inventories/templates/inventory.action.html',
  }];

  // grouping box
  vm.groupingBox = [
    { label : 'STOCK.INVENTORY_GROUP', value : 'group_name' },
  ];

  vm.gridOptions = {
    appScopeProvider   : vm,
    columnDefs         : columns,
    enableColumnMenus  : false,
    enableSorting      : true,
    fastWatch          : true,
    flatEntityAccess   : true,
    onRegisterApi,
    rowTemplate        : 'modules/stock/inventories/templates/shipment.tmpl.html',
    showGridFooter     : true,
  };

  const gridColumns = new Columns(vm.gridOptions, cacheKey);
  const state = new GridState(vm.gridOptions, cacheKey);

  vm.grouping = new Grouping(vm.gridOptions, true, 'depot_text', vm.grouped, true);
  vm.enterprise = Session.enterprise;
  vm.gridApi = {};
  vm.saveGridState = state.saveGridState;
  vm.getQueryString = Stock.getQueryString;

  /**
   *
   */
  function clearGridState() {
    state.clearGridState();
    $state.reload();
  }

  /**
   *
   * @param gridApi
   */
  function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  }

  // expose view logic
  vm.search = search;
  vm.onRemoveFilter = onRemoveFilter;
  vm.openColumnConfigModal = openColumnConfigModal;
  vm.clearGridState = clearGridState;

  // select group
  vm.selectGroup = (group) => {
    if (!group) { return; }

    vm.selectedGroup = group;
  };

  // toggle group
  vm.toggleGroup = (column) => {
    if (vm.grouped) {
      vm.grouping.removeGrouping(column);
      vm.grouped = false;
    } else {
      vm.grouping.changeGrouping(column);
      vm.grouped = true;
    }
  };

  // shipment in transit
  /**
   *
   * @param status
   */
  function isInTransitOrPartial(status) {
    return status === bhConstants.shipmentStatus.IN_TRANSIT || status === bhConstants.shipmentStatus.PARTIAL;
  }

  // This function opens a modal through column service to let the user toggle
  // the visibility of the inventories registry's columns.
  /**
   *
   */
  function openColumnConfigModal() {
    // column configuration has direct access to the grid API to alter the current
    // state of the columns - this will be saved if the user saves the grid configuration
    gridColumns.openConfigurationModal();
  }

  /**
   *
   */
  function setDefaultFilters() {
    const assignedKeys = Object.keys(stockInventoryFilters.formatHTTP());

    // assign default includeEmptyLot filter or showPendingTransfers
    if ((assignedKeys.indexOf('includeEmptyLot') === -1) || (assignedKeys.indexOf('showPendingTransfers') === -1)) {
      if (assignedKeys.indexOf('includeEmptyLot') === -1) {
        stockInventoryFilters.assignFilter('includeEmptyLot', 0);
      }

      if (assignedKeys.indexOf('showPendingTransfers') === -1) {
        stockInventoryFilters.assignFilter('showPendingTransfers', 0);
      }

      stockInventoryFilters.formatCache();
      vm.latestViewFilters = stockInventoryFilters.formatView();
    }
  }

  /**
   *
   * @param item
   */
  function setStatusFlag(item) {

    item.noAlert = !item.hasRiskyLots && !item.hasNearExpireLots && !item.hasExpiredLots;
    item.alert = item.hasExpiredLots;
    item.warning = !item.hasExpiredLots && (item.hasNearExpireLots || item.hasRiskyLots);

    item.hasStockOut = item.status === bhConstants.stockStatus.IS_STOCK_OUT;
    item.isInStock = item.status === bhConstants.stockStatus.IS_IN_STOCK;
    item.hasSecurityWarning = item.status === bhConstants.stockStatus.HAS_SECURITY_WARNING;
    item.hasMinimumWarning = item.status === bhConstants.stockStatus.HAS_MINIMUM_WARNING;
    item.hasOverageWarning = item.status === bhConstants.stockStatus.HAS_OVERAGE_WARNING;
    item.isUnusedStock = item.status === bhConstants.stockStatus.UNUSED_STOCK;
  }

  // on remove one filter
  /**
   *
   * @param key
   */
  function onRemoveFilter(key) {
    stockInventoryFilters.remove(key);
    stockInventoryFilters.formatCache();
    vm.latestViewFilters = stockInventoryFilters.formatView();
    return load(stockInventoryFilters.formatHTTP(true));
  }

  /**
   *
   * @param rowA
   * @param rowB
   */
  function orderByDepot(rowA, rowB) {
    return rowA.depot_text > rowB.depot_text ? 1 : -1;
  }

  // load stock lots in the grid
  /**
   *
   * @param filters
   */
  function load(filters) {
    const glb = {};
    vm.hasError = false;
    vm.loading = true;

    Stock.inventories.read(null, filters)
      .then((rows) => {

        // FIXME(@jniles): we should do this ordering on the server via an ORDER BY
        rows.sort(orderByDepot);

        // set status flags
        rows.forEach(row => {
          setStatusFlag(row);
          row.status_translated = $translate.instant(Stock.statusLabelMap(row.status));
          row.unit_type = $translate.instant(row.unit_type);
        });

        glb.inventories = rows;
        return Stock.shipment.getInTransitInventories(filters);
      })
      .then(rows => {
        rows.forEach(row => {
          // inventory is concerned by a shipment in transit or partially received
          row._isInTransitOrPartial = isInTransitOrPartial(row.shipment_status);
          row.__isInTransitTooltip = $translate
            .instant('SHIPMENT.IS_IN_TRANSIT_TOOLTIP', { depot : row.destination });
        });
        vm.gridOptions.data = glb.inventories.concat(rows);
        vm.grouping.unfoldAllGroups();
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  // open a modal to let user filtering data
  /**
   *
   */
  function search() {
    const filtersSnapshot = stockInventoryFilters.formatHTTP();

    StockModal.openSearchInventories(filtersSnapshot)
      .then((changes) => {
        if (!changes) { return; }
        stockInventoryFilters.replaceFilters(changes);
        stockInventoryFilters.formatCache();
        vm.latestViewFilters = stockInventoryFilters.formatView();
        load(stockInventoryFilters.formatHTTP(true));
      });
  }

  /**
   *
   */
  function startup() {
    setDefaultFilters();

    if ($state.params.filters.length) {
      stockInventoryFilters.replaceFiltersFromState($state.params.filters);
      stockInventoryFilters.formatCache();
    }

    load(stockInventoryFilters.formatHTTP(true));
    vm.latestViewFilters = stockInventoryFilters.formatView();
  }

  vm.exportTo = (renderer) => {
    const filterOpts = stockInventoryFilters.formatHTTP();
    const defaultOpts = {
      renderer,
      lang : Languages.key,
    };
    const options = angular.merge(defaultOpts, filterOpts);
    // return  serialized options
    return $httpParamSerializer(options);
  };

  vm.downloadExcel = () => {
    const filterOpts = stockInventoryFilters.formatHTTP();
    const defaultOpts = {
      renderer : 'xlsx',
      lang : Languages.key,
      renameKeys : true,
      displayNames : gridColumns.getDisplayNames(),
    };
    // combine options
    const options = angular.merge(defaultOpts, filterOpts);
    // return  serialized options
    return $httpParamSerializer(options);
  };

  vm.toggleInlineFilter = () => {
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  };

  vm.viewAMCCalculations = viewAMCCalculations;

  /**
   *
   * @param item
   */
  function viewAMCCalculations(item) {
    StockModal.openAMCCalculationModal(item)
      .catch(angular.noop);
  }

  // lot schedule modal
  vm.openLotScheduleModal = (uuid, inventoryUuid, depotUuid) => {
    StockModal.openLotScheduleModal({ uuid, inventoryUuid, depotUuid })
      .catch(angular.noop);
  };

  /**
   * @function openBarcodeScanner
   * @description
   * Opens the barcode scanner component and receives the record from the
   * modal.
   */
  function openBarcodeScanner() {
    Barcode.modal({ shouldSearch : false })
      .then(record => {
        stockInventoryFilters.replaceFilters([
          { key : 'inventory_uuid', value : record.uuid, displayValue : record.reference },
        ]);

        load(stockInventoryFilters.formatHTTP(true));
        vm.latestViewFilters = stockInventoryFilters.formatView();
      });
  }

  /**
   *
   * @param row
   */
  function openStockSheetReport(row) {
    const filters = stockInventoryFilters.formatHTTP();
    const options = {
      renderer : 'pdf',
      lang : Languages.key,
      inventory_uuid : row.inventory_uuid,
      depot_uuid : row.depot_uuid,
      report_id : 14,
      period : filters.period || 'year',
      custom_period_end : filters.custom_period_end,
      custom_period_start : filters.custom_period_start,
      orientation : 'landscape',
    };

    // return  serialized options
    return $httpParamSerializer(options);
  }

  startup();
}
