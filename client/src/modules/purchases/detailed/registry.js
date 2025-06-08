angular.module('bhima.controllers')
  .controller('PurchaseDetailedController', PurchaseDetailedController);

PurchaseDetailedController.$inject = [
  '$state', 'NotifyService', 'uiGridConstants',
  'GridColumnService', 'GridStateService', 'SessionService', 'ModalService',
  'ReceiptModal', 'bhConstants', 'BarcodeService', 'PurchaseDetailedService',
  'GridGroupingService',
];

/**
 * Purchase Order Detailed Controller
 *
 * This module is responsible for the management of Purchase Order Detailed.
 */
function PurchaseDetailedController(
  $state, Notify, uiGridConstants,
  Columns, GridState, Session, Modal, ReceiptModal, bhConstants, Barcode, PurchaseDetailed, Grouping,
) {
  const vm = this;
  const cacheKey = 'PurchaseDetailed';

  vm.search = search;
  vm.openColumnConfiguration = openColumnConfiguration;
  vm.gridApi = {};
  vm.toggleInlineFilter = toggleInlineFilter;
  vm.onRemoveFilter = onRemoveFilter;
  vm.download = PurchaseDetailed.download;
  vm.status = bhConstants.purchaseStatus;
  vm.actions = bhConstants.actions;

  // grouping box
  vm.groupingBox = PurchaseDetailed.groupingBox;

  // barcode scanner
  vm.openBarcodeScanner = openBarcodeScanner;

  vm.openPurchaseDetailedAnalysisReport = (row) => {
    const params = PurchaseDetailed.openPurchaseOrderAnalysisReport(row);
    const link = `/reports/purchase_order_analysis?${params}`;
    return link;
  };

  vm.editStatus = editStatus;

  vm.FLUX_FROM_PURCHASE = bhConstants.flux.FROM_PURCHASE;

  const allowEditStatus = statusId => {
    const forbidden = [
      vm.status.RECEIVED,
      vm.status.PARTIALLY_RECEIVED,
      vm.status.EXCESSIVE_RECEIVED_QUANTITY,
    ];

    return !forbidden.includes(statusId);
  };

  // track if module is making a HTTP request for purchase order
  vm.loading = false;

  const columnDefs = [{
    field : 'reference',
    displayName : 'FORM.LABELS.REFERENCE',
    headerCellFilter : 'translate',
    aggregationType : uiGridConstants.aggregationTypes.count,
    aggregationHideLabel : true,
  }, {
    field : 'info_purchase_number',
    displayName : 'PURCHASES.INFO.PURCHASE_NUMBER',
    headerCellFilter : 'translate',
    visible : false,
  }, {
    field : 'info_prf_number',
    displayName : 'PURCHASES.INFO.PRF_NUMBER',
    headerCellFilter : 'translate',
    visible : false,
  }, {
    field : 'date',
    displayName : 'FORM.LABELS.DATE',
    headerCellFilter : 'translate',
    cellFilter : 'date',
  }, {
    field : 'created_at',
    type : 'date',
    displayName : 'FORM.LABELS.SERVER_DATE',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/journal/templates/created_at.cell.html',
    visible : false,
  }, {
    field : 'supplier',
    displayName : 'FORM.LABELS.SUPPLIER',
    headerCellFilter : 'translate',
  }, {
    field : 'inventory_text',
    displayName : 'FORM.LABELS.DESIGNATION',
    headerCellFilter : 'translate',
  }, {
    field : 'quantity',
    displayName : 'FORM.LABELS.QUANTITY_ORDERED',
    headerTooltip : 'FORM.LABELS.QUANTITY_ORDERED',
    cellClass : 'text-right',
    headerCellFilter : 'translate',
    type : 'number',
  }, {
    field : 'packaged',
    displayName : 'TABLE.COLUMNS.PACKAGED',
    headerTooltip : 'TABLE.COLUMNS.PACKAGED',
    cellClass : 'text-right',
    width : 150,
    headerCellFilter : 'translate',
    cellTemplate : '/modules/purchases/templates/packaged.tmpl.html',
    type : 'number',
    visible : false,
  }, {
    field : 'quantity_delivered',
    displayName : 'STOCK.QUANTITY_RECEIVED',
    headerTooltip : 'STOCK.QUANTITY_RECEIVED',
    cellClass : 'text-right',
    headerCellFilter : 'translate',
    type : 'number',
  }, {
    field : 'balance',
    displayName : 'STOCK.QUANTITY_REMAINING',
    headerTooltip : 'STOCK.QUANTITY_REMAINING',
    cellClass : 'text-right',
    headerCellFilter : 'translate',
    type : 'number',
  }, {
    cellTemplate : '/modules/purchases/templates/purchase_price.tmpl.html',
    field : 'inventory_purchase_price',
    displayName : 'TABLE.COLUMNS.PURCHASE_UNIT_PRICE',
    headerCellFilter : 'translate',
    get footerCellFilter() {
      return this._footerCellFilter;
    },
    set footerCellFilter(value) {
      this._footerCellFilter = value;
    },
    aggregationHideLabel : true,
    type : 'number',
  }, {
    field : 'note',
    displayName : 'FORM.LABELS.DESCRIPTION',
    headerCellFilter : 'translate',
  }, {
    field : 'responsible',
    displayName : 'FORM.LABELS.RESPONSIBLE',
    headerCellFilter : 'translate',
  }, {
    field : 'author',
    displayName : 'FORM.LABELS.AUTHOR',
    headerCellFilter : 'translate',
  }, {
    field : 'status',
    displayName : 'FORM.LABELS.STATUS',
    cellTemplate : '/modules/purchases/templates/cellStatusDetailed.tmpl.html',
    headerCellFilter : 'translate',
    enableFiltering : false,
    enableSorting : false,
  }, {
    field : 'action',
    displayName : '',
    enableFiltering : false,
    enableColumnMenu : false,
    enableSorting : false,
    cellTemplate : 'modules/purchases/templates/action.cell.html',
  }];

  vm.uiGridOptions = {
    appScopeProvider : vm,
    showColumnFooter : true,
    enableSorting : true,
    enableColumnMenus : false,
    enableGroupHeaderSelection : true,
    flatEntityAccess : true,
    fastWatch : true,
    onRegisterApi : (api) => { vm.gridApi = api; },
    columnDefs,
  };

  const columnConfig = new Columns(vm.uiGridOptions, cacheKey);
  const state = new GridState(vm.uiGridOptions, cacheKey);

  // expose to the view model
  vm.grouping = new Grouping(vm.uiGridOptions, true, 'reference', vm.grouped, true);

  vm.saveGridState = state.saveGridState;
  vm.clearGridState = function clearGridState() {
    state.clearGridState();
    $state.reload();
  };

  function toggleInlineFilter() {
    vm.uiGridOptions.enableFiltering = !vm.uiGridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

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

  // error handler
  function handler(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  vm.getDocument = (uuid) => ReceiptModal.purchase(uuid);

  // edit status
  function editStatus(purchase) {
    Modal.openPurchaseDetailedStatus(purchase)
      .then((reload) => {
        if (reload) {
          load(PurchaseDetailed.filters.formatHTTP(true));
        }
      })
      .catch(handler);
  }

  /* load purchase orders */
  function load(filters) {
    // flush error and loading states
    vm.hasError = false;
    toggleLoadingIndicator();

    PurchaseDetailed.getPurchaseDetailed(filters)
      .then((purchases) => {

        purchases.forEach(purchase => {
          purchase.hasStockMovement = !allowEditStatus(purchase.status_id);
        });

        vm.uiGridOptions.data = purchases;

        vm.grouping.unfoldAllGroups();
        vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
      })
      .catch(handler)
      .finally(toggleLoadingIndicator);
  }

  function search() {
    const filtersSnapshot = PurchaseDetailed.filters.formatHTTP();

    PurchaseDetailed.openSearchModal(filtersSnapshot)
      .then((changes) => {
        if (!changes) {
          // Exit immediatly if the user closes the Search dialog with no changes
          return;
        }
        PurchaseDetailed.filters.replaceFilters(changes);
        PurchaseDetailed.cacheFilters();
        vm.latestViewFilters = PurchaseDetailed.filters.formatView();
        // eslint-disable-next-line consistent-return
        return load(PurchaseDetailed.filters.formatHTTP(true));
      });
  }

  // remove a filter with from the filter object, save the filters and reload
  function onRemoveFilter(key) {
    PurchaseDetailed.removeFilter(key);
    PurchaseDetailed.cacheFilters();
    vm.latestViewFilters = PurchaseDetailed.filters.formatView();
    return load(PurchaseDetailed.filters.formatHTTP(true));
  }

  function openColumnConfiguration() {
    columnConfig.openConfigurationModal();
  }

  // toggles the loading indicator on or off
  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  // startup function. Checks for cached filters and loads them.  This behavior could be changed.
  function startup() {
    if ($state.params.filters.length) {
      PurchaseDetailed.filters.replaceFiltersFromState($state.params.filters);
      PurchaseDetailed.cacheFilters();
    }

    load(PurchaseDetailed.filters.formatHTTP(true));
    vm.latestViewFilters = PurchaseDetailed.filters.formatView();
  }

  vm.deletePurchaseDetailed = deletePurchaseDetailedWithConfirmation;
  function deletePurchaseDetailedWithConfirmation(entity) {
    Modal.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then((isOk) => {
        if (isOk) { remove(entity); }
      });
  }

  // allows users to delete purchase orders
  function remove(purchase) {
    PurchaseDetailed.delete(purchase.uuid)
      .then(() => {
        Notify.success('FORM.INFO.DELETE_RECORD_SUCCESS');
        return load(PurchaseDetailed.filters.formatHTTP(true));
      });
  }

  vm.allowRecordDeletion = function allowRecordDeletion(purchase) {
    return purchase.status_id === vm.status.WAITING_CONFIRMATION;
  };

  /**
   * @function searchByBarcode()
   *
   * @description
   * Opens the barcode scanner component and receives the record from the
   * modal.
   */
  function openBarcodeScanner() {
    Barcode.modal({ shouldSearch : true })
      .then(record => {
        PurchaseDetailed.filters.replaceFilters([
          { key : 'uuid', value : record.uuid, displayValue : record.reference },
          { key : 'period', value : 'allTime' },
        ]);

        load(PurchaseDetailed.filters.formatHTTP(true));
        vm.latestViewFilters = PurchaseDetailed.filters.formatView();
      });

  }

  // fire up the module
  startup();
}
