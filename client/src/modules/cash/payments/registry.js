angular.module('bhima.controllers')
  .controller('CashPaymentRegistryController', CashPaymentRegistryController);

CashPaymentRegistryController.$inject = [
  'CashService', 'bhConstants', 'NotifyService', 'SessionService', 'uiGridConstants',
  'ModalService', 'GridSortingService', '$state', 'FilterService',
  'GridColumnService', 'GridStateService', 'util', 'ReceiptModal', 'BarcodeService',
];

/**
 * Cash Payment Registry Controller
 *
 * This controller is responsible to display all cash payment made and provides
 * print and search utilities for the registry.
 * @param Cash
 * @param bhConstants
 * @param Notify
 * @param Session
 * @param uiGridConstants
 * @param Modal
 * @param Sorting
 * @param $state
 * @param Filters
 * @param Columns
 * @param GridState
 * @param util
 * @param Receipts
 * @param Barcode
 */
function CashPaymentRegistryController(
  Cash, bhConstants, Notify, Session, uiGridConstants, Modal, Sorting, $state,
  Filters, Columns, GridState, util, Receipts, Barcode,
) {
  const vm = this;

  // background color for make the difference between the valid and canceled payment
  const cacheKey = 'payment-grid';

  const filter = new Filters();

  vm.filter = filter;
  vm.format = util.formatDate;
  vm.Receipts = Receipts;
  vm.toggleInlineFilter = toggleInlineFilter;
  vm.isSettingEnabled = Session.isSettingEnabled;

  // global variables
  vm.enterprise = Session.enterprise;
  vm.bhConstants = bhConstants;

  // expose to the view
  vm.search = search;
  vm.onRemoveFilter = onRemoveFilter;
  vm.cancelCash = cancelCash;
  vm.openColumnConfigModal = openColumnConfigModal;
  vm.clearGridState = clearGridState;
  vm.deleteCashPayment = deleteCashPaymentWithConfirmation;
  vm.download = Cash.download;

  vm.openBarcodeScanner = openBarcodeScanner;

  const columnDefs = [{
    field : 'reference',
    displayName : 'TABLE.COLUMNS.REFERENCE',
    headerCellFilter : 'translate',
    aggregationType : uiGridConstants.aggregationTypes.count,
    aggregationHideLabel : true,
    sortingAlgorithm : Sorting.algorithms.sortByReference,
    cellTemplate : '/modules/cash/payments/templates/reference.html',
  }, {
    field : 'date',
    displayName : 'TABLE.COLUMNS.DATE',
    headerCellFilter : 'translate',
    cellTemplate : '/modules/cash/payments/templates/date.cell.html',
    type : 'date',
  }, {
    field : 'created_at',
    type : 'date',
    displayName : 'FORM.LABELS.SERVER_DATE',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/journal/templates/created_at.cell.html',
    visible : false,
  }, {
    name : 'patientName',
    displayName : 'TABLE.COLUMNS.CLIENT',
    headerCellFilter : 'translate',
  }, {
    field : 'description',
    displayName : 'TABLE.COLUMNS.DESCRIPTION',
    headerCellFilter : 'translate',
  }, {
    field : 'amount',
    displayName : 'TABLE.COLUMNS.AMOUNT',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/cash/payments/templates/amount.grid.html',
    type : 'number',

    // @TODO(jniles): This is temporary, as it doesn't take into account USD payments
    aggregationType : uiGridConstants.aggregationTypes.sum,
    aggregationHideLabel : true,
    footerCellClass : 'text-right',
  }, {
    field : 'cashbox_label',
    displayName : 'TABLE.COLUMNS.CASHBOX',
    headerCellFilter : 'translate',
  }, {
    field : 'display_name',
    displayName : 'TABLE.COLUMNS.USER',
    headerCellFilter : 'translate',
  }, {
    field : 'action',
    displayName : '',
    enableFiltering : false,
    enableSorting : false,
    cellTemplate : 'modules/cash/payments/templates/action.cell.html',
  }];

  // grid default options
  vm.gridOptions = {
    appScopeProvider  : vm,
    showColumnFooter  : true,
    enableColumnMenus : false,
    flatEntityAccess  : true,
    fastWatch         : true,
    columnDefs,
    rowTemplate       : '/modules/templates/row.reversed.html',
  };

  vm.gridOptions.onRegisterApi = function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  };

  /**
   *
   */
  function toggleInlineFilter() {
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  const gridColumns = new Columns(vm.gridOptions, cacheKey);
  const state = new GridState(vm.gridOptions, cacheKey);

  // saves the grid's current configuration
  vm.saveGridState = state.saveGridState;
  /**
   *
   */
  function clearGridState() {
    state.clearGridState();
    $state.reload();
  }

  /**
   *
   * @param error
   */
  function handleError(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  /**
   *
   */
  function search() {
    const filtersSnapshot = Cash.filters.formatHTTP();

    Modal.openSearchCashPayment(filtersSnapshot)
      .then((changes) => {
        Cash.filters.replaceFilters(changes);

        Cash.cacheFilters();
        vm.latestViewFilters = Cash.filters.formatView();

        return load(Cash.filters.formatHTTP(true));
      })
      .catch(angular.noop);
  }

  // remove a filter with from the filter object, save the filters and reload
  /**
   *
   * @param key
   */
  function onRemoveFilter(key) {
    Cash.removeFilter(key);

    Cash.cacheFilters();
    vm.latestViewFilters = Cash.filters.formatView();

    return load(Cash.filters.formatHTTP(true));
  }

  // load cash
  /**
   *
   * @param filters
   */
  function load(filters) {
    const request = Cash.read(null, filters);

    vm.hasError = false;
    toggleLoadingIndicator();

    request
      .then(payments => {
        vm.gridOptions.data = payments;
      })
      .catch(handleError)
      .finally(toggleLoadingIndicator);
  }

  // Function for Cancel Cash cancel all Invoice
  /**
   *
   * @param cash
   */
  function cancelCash(cash) {
    Cash.openCancelCashModal(cash)
      .then((success) => {
        if (!success) { return; }
        Notify.success('FORM.INFO.TRANSACTION_REVER_SUCCESS');
        load(Cash.filters.formatHTTP(true));
      });
  }

  /**
   *
   */
  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  /**
   *
   */
  function startup() {
    if ($state.params.filters.length) {
      Cash.filters.replaceFiltersFromState($state.params.filters);
      Cash.cacheFilters();
    }

    load(Cash.filters.formatHTTP(true));
    vm.latestViewFilters = Cash.filters.formatView();
  }

  // This function opens a modal through column service to let the user toggle
  // the visibility of the cash registry's columns.
  /**
   *
   */
  function openColumnConfigModal() {
    gridColumns.openConfigurationModal();
  }

  /**
   *
   * @param entity
   */
  function remove(entity) {
    Cash.remove(entity.uuid)
      .then(() => {
        Notify.success('FORM.INFO.DELETE_RECORD_SUCCESS');

        // load() has it's own error handling.  The absence of return below is
        // explicit.
        load(Cash.filters.formatHTTP(true));
      })
      .catch(Notify.handleError);
  }

  // this function deletes the cash payment and associated transactions from
  // the database
  /**
   *
   * @param entity
   */
  function deleteCashPaymentWithConfirmation(entity) {
    Modal.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then((isOk) => {
        if (isOk) { remove(entity); }
      });
  }

  /**
   * @function openBarcodeScanner
   * @description
   * Opens the barcode scanner component and receives the record from the
   * modal.
   */
  function openBarcodeScanner() {
    Barcode.modal()
      .then(record => {
        Cash.filters.replaceFilters([
          { key : 'uuid', value : record.uuid, displayValue : record.reference },
        ]);

        load(Cash.filters.formatHTTP(true));
        vm.latestViewFilters = Cash.filters.formatView();
      });
  }

  startup();
}
