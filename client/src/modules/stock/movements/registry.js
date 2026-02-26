angular.module('bhima.controllers')
  .controller('StockMovementsController', StockMovementsController);

StockMovementsController.$inject = [
  'StockService', 'NotifyService', 'uiGridConstants',
  'StockModalService', 'LanguageService', 'SessionService', 'FluxService',
  'ReceiptModal', 'GridGroupingService', '$state', 'GridColumnService', 'GridStateService', '$httpParamSerializer',
  '$translate', 'bhConstants', 'ModalService',
];

/**
 * Stock movements registry Controller
 * This module is a registry page for stock movements
 * where each line represent a single movement
 * @param Stock
 * @param Notify
 * @param uiGridConstants
 * @param Modal
 * @param Languages
 * @param Session
 * @param Flux
 * @param ReceiptModal
 * @param Grouping
 * @param $state
 * @param Columns
 * @param GridState
 * @param $httpParamSerializer
 * @param $translate
 * @param bhConstants
 * @param ModalService
 */
function StockMovementsController(
  Stock, Notify, uiGridConstants, Modal,
  Languages, Session, Flux, ReceiptModal, Grouping, $state, Columns, GridState, $httpParamSerializer,
  $translate, bhConstants, ModalService,
) {
  const vm = this;
  const cacheKey = 'movements-grid';
  const stockMovementsFilters = Stock.filter.movements;

  // grid columns
  const columns = getGridColumns();

  // add in FLUX identifiers
  vm.flux = bhConstants.flux;
  vm.bhConstants = bhConstants;

  // grouping box
  vm.groupingBox = [
    { label : 'STOCK.IO', value : 'io' },
  ];

  vm.gridApi = {};

  /**
   *
   * @param rows
   */
  function aggregateCostColumn(rows) {
    // base case: no data to aggregate, just return 0.
    if (rows.length === 0) {
      return 0;
    }

    // get the last direction
    const direction = rows[rows.length - 1].entity.is_exit;

    let value = 0;
    let i = rows.length;
    let hasMixedEntryExit = false;

    while (i--) {
      const row = rows[i].entity;

      // skip group headers
      if (row.is_exit === undefined) {
        continue;  
      }

      // do not sum if the direction is not correct
      if (row.is_exit !== direction) {
        hasMixedEntryExit = true;
        break;
      }

      value += row.cost;
    }

    return hasMixedEntryExit ? '---' : value;
  }

  // global variables
  vm.enterprise = Session.enterprise;

  /**
   *
   */
  function getGridColumns() {
    return [{
      field : 'depot_text',
      displayName : 'STOCK.DEPOT',
      headerCellFilter : 'translate',
      aggregationType : uiGridConstants.aggregationTypes.count,
      aggregationHideLabel : true,
    }, {
      field : 'documentReference',
      displayName : 'TABLE.COLUMNS.REFERENCE',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/movements/templates/reference.cell.html',
    }, {
      field : 'io',
      displayName : 'STOCK.IO',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/movements/templates/io.cell.html',
    }, {
      field : 'fluxName',
      displayName : 'STOCK.FLUX',
      headerCellFilter : 'translate',
    }, {
      field : 'description',
      displayName : 'TABLE.COLUMNS.DESCRIPTION',
      headerTooltip : 'TABLE.COLUMNS.DESCRIPTION',
      headerCellFilter : 'translate',
      visible : false,
    }, {
      field : 'target',
      displayName : 'FORM.LABELS.TARGET',
      headerTooltip : 'FORM.LABELS.TARGET',
      headerCellFilter : 'translate',
      visible : false,
    }, {
      field : 'cost',
      type : 'number',
      displayName : 'STOCK.COST',
      headerCellFilter : 'translate',
      cellFilter : 'currency:grid.appScope.enterprise.currency_id',
      cellClass : 'text-right',
      footerCellClass : 'text-right',
      footerCellFilter : 'currency:grid.appScope.enterprise.currency_id',
      aggregationHideLabel : true,
      aggregationType : aggregateCostColumn,
    }, {
      field            : 'wac',
      displayName      : 'STOCK.WAC',
      headerTooltip    : 'STOCK.WAC',
      headerCellFilter : 'translate',
      cellFilter       : 'currency:grid.appScope.enterprise.currency_id',
      cellClass        : 'text-right',
      type             : 'number',
      visible          : false,
    }, {
      field : 'date',
      type : 'date',
      displayName : 'FORM.LABELS.DATE',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/movements/templates/date.cell.html',
    }, {
      field : 'created_at',
      type : 'date',
      displayName : 'FORM.LABELS.SERVER_DATE',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/movements/templates/created_at.cell.html',
      visible : false,
    }, {
      field : 'document_requisition',
      displayName : 'REQUISITION.STOCK_REQUISITION',
      headerTooltip : 'REQUISITION.STOCK_REQUISITION',
      headerCellFilter : 'translate',
      visible : false,
    }, {
      field : 'userName',
      displayName : 'FORM.LABELS.USER',
      headerCellFilter : 'translate',
    }, {
      field : 'action',
      displayName : '',
      enableFiltering : false,
      enableSorting : false,
      cellTemplate : 'modules/stock/movements/templates/action.cell.html',
    }];
  }

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider : vm,
    enableColumnMenus : false,
    columnDefs : columns,
    enableSorting : true,
    showColumnFooter : true,
    onRegisterApi : onRegisterApiFn,
    fastWatch : true,
    flatEntityAccess : true,
  };

  vm.grouping = new Grouping(vm.gridOptions, true, 'depot_text', vm.grouped, true);

  // expose to the view
  vm.search = search;
  vm.openColumnConfigModal = openColumnConfigModal;
  vm.onRemoveFilter = onRemoveFilter;
  vm.getFluxName = getFluxName;
  vm.openReceiptModal = (uuid, fluxId) => ReceiptModal.getReceiptFnByFluxId(fluxId)(uuid);
  vm.toggleGroup = toggleGroup;
  vm.selectGroup = selectGroup;
  vm.getQueryString = getQueryString;
  vm.clearGridState = clearGridState;

  const gridColumns = new Columns(vm.gridOptions, cacheKey);
  const state = new GridState(vm.gridOptions, cacheKey);

  /**
   *
   * @param options
   */
  function getQueryString(options) {
    return stockMovementsFilters.getQueryString(options);
  }

  // grid api
  /**
   *
   * @param gridApi
   */
  function onRegisterApiFn(gridApi) {
    vm.gridApi = gridApi;
  }

  // select group
  /**
   *
   * @param group
   */
  function selectGroup(group) {
    if (!group) { return; }

    vm.selectedGroup = group;
  }

  // toggle group
  /**
   *
   * @param column
   */
  function toggleGroup(column) {
    if (vm.grouped) {
      vm.grouping.removeGrouping(column);
      vm.grouped = false;
    } else {
      vm.grouping.changeGrouping(column);
      vm.grouped = true;
    }
  }

  // on remove one filter
  /**
   *
   * @param key
   */
  function onRemoveFilter(key) {
    stockMovementsFilters.remove(key);
    stockMovementsFilters.formatCache();
    vm.latestViewFilters = stockMovementsFilters.formatView();
    return load(stockMovementsFilters.formatHTTP(true));
  }

  // This function opens a modal through column service to let the user toggle
  // the visibility of the lots registry's columns.
  /**
   *
   */
  function openColumnConfigModal() {
    // column configuration has direct access to the grid API to alter the current
    // state of the columns - this will be saved if the user saves the grid configuration
    gridColumns.openConfigurationModal();
  }

  vm.saveGridState = state.saveGridState;

  /**
   *
   */
  function clearGridState() {
    state.clearGridState();
    $state.reload();
  }

  // load stock lots in the grid
  /**
   *
   * @param filters
   */
  function load(filters) {
    vm.hasError = false;
    vm.loading = true;

    Stock.inlineMovements.read(null, filters)
      .then(handleMovementRows)
      .catch(Notify.handleError)
      .finally(toggleLoading);
  }

  /**
   *
   * @param rows
   */
  function handleMovementRows(rows) {
    // preprocess data
    rows.forEach(handleMovementRow);

    vm.gridOptions.data = rows;

    // force expand grid
    vm.grouping.unfoldAllGroups();
  }

  /**
   *
   * @param row
   */
  function handleMovementRow(row) {
    // the column must be filtered on the translated text
    row.io = $translate.instant(row.is_exit === 0 ? 'STOCK.INPUT' : 'STOCK.OUTPUT');

    const fluxName = $translate.instant(getFluxName(row.flux_id));
    // compute the fluxName from its ID
    row.fluxName = fluxName.concat(row.target ? ` - ${row.target}` : '').trim();
  }

  /**
   *
   */
  function toggleLoading() {
    vm.loading = !vm.loading;
  }

  // search modal
  /**
   *
   */
  function search() {
    const filtersSnapshot = stockMovementsFilters.formatHTTP();

    Modal.openSearchMovements(filtersSnapshot)
      .then(handleSearchModal);
  }

  /**
   *
   * @param changes
   */
  function handleSearchModal(changes) {
    // if there is no change , customer filters should not change
    if (!changes) { return; }

    stockMovementsFilters.replaceFilters(changes);
    stockMovementsFilters.formatCache();
    vm.latestViewFilters = stockMovementsFilters.formatView();
    load(stockMovementsFilters.formatHTTP(true));
  }

  // get flux name
  /**
   *
   * @param id
   */
  function getFluxName(id) {
    return Flux.translate[id];
  }

  // initialize module
  /**
   *
   */
  function startup() {
    if ($state.params.filters.length) {
      stockMovementsFilters.replaceFiltersFromState($state.params.filters);
      stockMovementsFilters.formatCache();
    }

    load(stockMovementsFilters.formatHTTP(true));
    vm.latestViewFilters = stockMovementsFilters.formatView();
  }

  vm.hasAutoStockAccounting = Session.stock_settings.enable_auto_stock_accounting;

  vm.deleteMovement = documentUuid => {
    return ModalService.confirm()
      .then(ans => {
        if (!ans) { return null; }

        return Stock.inlineMovements.delete(documentUuid);
      })
      .then(() => {
        Notify.success('STOCK.SUCCESSFULLY_DELETED');
        load(stockMovementsFilters.formatHTTP(true));
      })
      .catch(Notify.handleError);
  };

  vm.downloadExcel = () => {
    const filterOpts = stockMovementsFilters.formatHTTP();
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

  startup();
}
