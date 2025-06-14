angular.module('bhima.controllers')
  .controller('PurchaseRegistryController', PurchaseRegistryController);

PurchaseRegistryController.$inject = [
  '$state', 'PurchaseOrderService', 'NotifyService', 'uiGridConstants',
  'GridColumnService', 'GridStateService', 'SessionService', 'ModalService',
  'ReceiptModal', 'bhConstants', 'BarcodeService',
];

/**
 * Purchase Order Registry Controller
 *
 * This module is responsible for the management of Purchase Order Registry.
 */
function PurchaseRegistryController(
  $state, Purchases, Notify, uiGridConstants,
  Columns, GridState, Session, Modal, ReceiptModal, bhConstants, Barcode,
) {
  const vm = this;
  const cacheKey = 'PurchaseRegistry';

  vm.search = search;
  vm.openColumnConfiguration = openColumnConfiguration;
  vm.gridApi = {};
  vm.toggleInlineFilter = toggleInlineFilter;
  vm.onRemoveFilter = onRemoveFilter;
  vm.download = Purchases.download;
  vm.status = bhConstants.purchaseStatus;
  vm.actions = bhConstants.actions;

  const blockEditState = [
    bhConstants.purchaseStatus.RECEIVED,
    bhConstants.purchaseStatus.PARTIALLY_RECEIVED,
    bhConstants.purchaseStatus.EXCESSIVE_RECEIVED_QUANTITY,
  ];

  // barcode scanner
  vm.openBarcodeScanner = openBarcodeScanner;

  vm.openPurchaseDetailedAnalysisReport = (row) => {
    const params = Purchases.openPurchaseOrderAnalysisReport(row);
    const link = `/reports/purchase_order_analysis?${params}`;
    return link;
  };

  vm.editStatus = editStatus;

  vm.FLUX_FROM_PURCHASE = bhConstants.flux.FROM_PURCHASE;

  const allowEditStatus = statusId => !blockEditState.includes(statusId);

  // track if module is making a HTTP request for purchase order
  vm.loading = false;

  const columnDefs = [{
    field : 'reference',
    displayName : 'FORM.LABELS.REFERENCE',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/purchases/templates/uuid.tmpl.html',
    aggregationType : uiGridConstants.aggregationTypes.count,
    aggregationHideLabel : true,
  }, {
    field : 'date',
    displayName : 'FORM.LABELS.DATE',
    headerCellFilter : 'translate',
    cellFilter : 'date',
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
    field : 'note',
    displayName : 'FORM.LABELS.DESCRIPTION',
    headerCellFilter : 'translate',
  }, {
    cellTemplate : '/modules/purchases/templates/cellCost.tmpl.html',
    field : 'cost',
    displayName : 'FORM.LABELS.COST',
    headerCellFilter : 'translate',
    footerCellFilter : 'currency:'.concat(Session.enterprise.currency_id),
    aggregationType : uiGridConstants.aggregationTypes.sum,
    aggregationHideLabel : true,
    type : 'number',
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
    cellTemplate : '/modules/purchases/templates/cellStatus.tmpl.html',
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
    flatEntityAccess : true,
    fastWatch : true,
    onRegisterApi : (api) => { vm.gridApi = api; },
    columnDefs,
  };

  const columnConfig = new Columns(vm.uiGridOptions, cacheKey);
  const state = new GridState(vm.uiGridOptions, cacheKey);

  vm.saveGridState = state.saveGridState;
  vm.clearGridState = function clearGridState() {
    state.clearGridState();
    $state.reload();
  };

  function toggleInlineFilter() {
    vm.uiGridOptions.enableFiltering = !vm.uiGridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  // error handler
  function handler(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  vm.getDocument = (uuid) => ReceiptModal.purchase(uuid);

  // edit status
  function editStatus(purchase) {
    Modal.openPurchasesStatus(purchase)
      .then((reload) => {
        if (reload) {
          load(Purchases.filters.formatHTTP(true));
        }
      })
      .catch(handler);
  }

  /* load purchase orders */
  function load(filters) {
    // flush error and loading states
    vm.hasError = false;
    toggleLoadingIndicator();

    Purchases.read(null, filters)
      .then((purchases) => {

        purchases.forEach(purchase => {
          purchase.hasStockMovement = !allowEditStatus(purchase.status_id);
        });

        vm.uiGridOptions.data = purchases;
      })
      .catch(handler)
      .finally(toggleLoadingIndicator);
  }

  function search() {
    const filtersSnapshot = Purchases.filters.formatHTTP();

    Purchases.openSearchModal(filtersSnapshot)
      .then((changes) => {
        if (!changes) {
          // Exit immediatly if the user closes the Search dialog with no changes
          return;
        }
        Purchases.filters.replaceFilters(changes);
        Purchases.cacheFilters();
        vm.latestViewFilters = Purchases.filters.formatView();
        // eslint-disable-next-line consistent-return
        return load(Purchases.filters.formatHTTP(true));
      });
  }

  // remove a filter with from the filter object, save the filters and reload
  function onRemoveFilter(key) {
    Purchases.removeFilter(key);
    Purchases.cacheFilters();
    vm.latestViewFilters = Purchases.filters.formatView();
    return load(Purchases.filters.formatHTTP(true));
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
      Purchases.filters.replaceFiltersFromState($state.params.filters);
      Purchases.cacheFilters();
    }

    load(Purchases.filters.formatHTTP(true));
    vm.latestViewFilters = Purchases.filters.formatView();
  }

  vm.deletePurchases = deletePurchasesWithConfirmation;
  function deletePurchasesWithConfirmation(entity) {
    Modal.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then((isOk) => {
        if (isOk) { remove(entity); }
      });
  }

  // allows users to delete purchase orders
  function remove(purchase) {
    Purchases.delete(purchase.uuid)
      .then(() => {
        Notify.success('FORM.INFO.DELETE_RECORD_SUCCESS');
        return load(Purchases.filters.formatHTTP(true));
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
        Purchases.filters.replaceFilters([
          { key : 'uuid', value : record.uuid, displayValue : record.reference },
          { key : 'period', value : 'allTime' },
        ]);

        load(Purchases.filters.formatHTTP(true));
        vm.latestViewFilters = Purchases.filters.formatView();
      });

  }

  // fire up the module
  startup();
}
