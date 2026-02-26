angular.module('bhima.controllers')
  .controller('VoucherController', VoucherController);

VoucherController.$inject = [
  'VoucherService', 'NotifyService', 'uiGridConstants', 'ReceiptModal',
  'TransactionTypeService', 'bhConstants', 'GridSortingService',
  'GridColumnService', 'GridStateService', '$state', 'ModalService', 'util',
  'SessionService', 'BarcodeService',
];

/**
 * Vouchers Registry Controller
 * @param Vouchers
 * @param Notify
 * @param uiGridConstants
 * @param Receipts
 * @param TransactionTypes
 * @param bhConstants
 * @param Sorting
 * @param Columns
 * @param GridState
 * @param $state
 * @param Modals
 * @param util
 * @param Session
 * @param Barcode
 * @description
 * This controller is responsible for display all vouchers in the voucher table as a
 * registry.  The registry supports client-side filtering, server-side searching, column
 * reordering, and many more features.
 */
function VoucherController(
  Vouchers, Notify, uiGridConstants, Receipts, TransactionTypes, bhConstants,
  Sorting, Columns, GridState, $state, Modals, util, Session, Barcode,
) {
  const vm = this;

  const cacheKey = 'voucher-grid';
  const transactionTypeMap = {};

  const {
    INCOME,
    EXPENSE,
    STOCK_EXIT,
    STOCK_ENTRY,
  } = bhConstants.transactionType;

  const stockMovementTypes = [
    STOCK_EXIT,
    STOCK_ENTRY,
  ];

  vm.gridOptions = {};
  vm.bhConstants = bhConstants;

  vm.search = search;
  vm.onRemoveFilter = onRemoveFilter;
  vm.openColumnConfigModal = openColumnConfigModal;
  vm.clearGridState = clearGridState;
  vm.download = Vouchers.download;
  vm.deleteVoucher = deleteVoucherWithConfirmation;
  vm.reverseVoucher = reverseVoucher;
  vm.showReceipt = showReceipt;
  vm.toggleInlineFilter = toggleInlineFilter;
  vm.openBarcodeScanner = openBarcodeScanner;

  // date format function
  vm.format = util.formatDate;

  vm.showReceipt = Receipts.voucher;

  vm.loading = false;

  // grid default options
  const columnDefs = [{
    field : 'reference',
    displayName : 'TABLE.COLUMNS.REFERENCE',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/vouchers/templates/uuid.tmpl.html',
    sortingAlgorithm : Sorting.algorithms.sortByReference,
    aggregationType      : uiGridConstants.aggregationTypes.count,
    aggregationHideLabel : true,
  }, {
    field : 'type_id',
    displayName : 'TABLE.COLUMNS.TYPE',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/templates/grid/voucherType.tmpl.html',
    aggregationHideLabel : true,
  }, {
    field : 'date',
    displayName : 'TABLE.COLUMNS.DATE',
    headerCellFilter : 'translate',
    type : 'date',
    cellTemplate : 'modules/vouchers/templates/date.cell.html',
  }, {
    field : 'created_at',
    type : 'date',
    displayName : 'FORM.LABELS.SERVER_DATE',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/journal/templates/created_at.cell.html',
    visible : false,
  }, {
    field : 'description',
    displayName : 'TABLE.COLUMNS.DESCRIPTION',
    headerCellFilter : 'translate',
  }, {
    field : 'amount',
    displayName : 'TABLE.COLUMNS.AMOUNT',
    headerCellFilter : 'translate',
    aggregationHideLabel : true,
    footerCellClass : 'text-right',
    type : 'number',
    cellTemplate : 'modules/vouchers/templates/amount.grid.tmpl.html',
  }, {
    field : 'project_name',
    displayName : 'TABLE.COLUMNS.PROJECT',
    headerCellFilter : 'translate',
  }, {
    field : 'display_name',
    displayName : 'TABLE.COLUMNS.RESPONSIBLE',
    headerCellFilter : 'translate',
  }, {
    field : 'action',
    displayName : '',
    enableFiltering : false,
    enableColumnMenu : false,
    enableSorting : false,
    cellTemplate : 'modules/vouchers/templates/action.cell.html',
  }];

  vm.gridOptions = {
    appScopeProvider : vm,
    showColumnFooter : true,
    enableColumnMenu : false,
    enableSorting : true,
    flatEntityAccess : true,
    fastWatch : true,
    rowTemplate : '/modules/templates/row.reversed.html',
    columnDefs,
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

  // search voucher
  /**
   *
   */
  function search() {
    const filtersSnapshot = Vouchers.filters.formatHTTP();

    Vouchers.openSearchModal(filtersSnapshot)
      .then(changes => {
        if (!changes) { return null; }

        Vouchers.filters.replaceFilters(changes);
        Vouchers.cacheFilters();
        vm.latestViewFilters = Vouchers.filters.formatView();

        return load(Vouchers.filters.formatHTTP(true));
      })
      .catch(angular.noop);
  }

  /**
   *
   * @param filters
   */
  function load(filters) {
    // flush error and loading states
    vm.hasError = false;
    toggleLoadingIndicator();

    Vouchers.read(null, filters)
      .then(vouchers => {

        vouchers.forEach(row => {
          row.isStockMovement = stockMovementTypes.includes(row.type_id);
        });

        vm.gridOptions.data = vouchers;

        // TODO(@jniles) - can we do better?
        vouchers.forEach(voucher => {
          const isNull = (voucher.type_id === null);

          if (!isNull) {
            const transactionType = transactionTypeMap[voucher.type_id];
            if (transactionType) {
              // determine the transaction_type for this voucher

              voucher._isIncome = (transactionType.type === INCOME);
              voucher._isExpense = (transactionType.type === EXPENSE);
              voucher._isOther = !(voucher._isIncome || voucher._isExpense);
              voucher._type = transactionType.text;
            }
          } else {
            voucher._type = '';
          }
        });
      })
      .catch(errorHandler)
      .finally(toggleLoadingIndicator);
  }

  // showReceipt
  /**
   *
   * @param uuid
   */
  function showReceipt(uuid) {
    Receipts.voucher(uuid);
  }

  // remove a filter with from the filter object, save the filters and reload
  /**
   *
   * @param key
   */
  function onRemoveFilter(key) {
    Vouchers.removeFilter(key);

    Vouchers.cacheFilters();
    vm.latestViewFilters = Vouchers.filters.formatView();

    return load(Vouchers.filters.formatHTTP(true));
  }

  /**
   * @param error
   * @function errorHandler
   * @description
   * Uses Notify to show an error in case the server sends back an information.
   * Triggers the error state on the grid.
   */
  function errorHandler(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  /**
   * @function toggleLoadingIndicator
   * @description
   * Toggles the grid's loading indicator to eliminate the flash when rendering
   * transactions and allow a better UX for slow loads.
   */
  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  // initialize module
  /**
   *
   */
  function startup() {
    if ($state.params.filters.length) {
      Vouchers.filters.replaceFiltersFromState($state.params.filters);
      Vouchers.cacheFilters();
    }

    vm.latestViewFilters = Vouchers.filters.formatView();

    // before we can properly render the vouchers, we need to have
    // a transaction type mapping set up.
    TransactionTypes.read()
      .then(types => {
        // organize transaction types into a map
        types.forEach(type => {
          transactionTypeMap[type.id] = type;
        });

        return load(Vouchers.filters.formatHTTP(true));
      });
  }

  // This function opens a modal through column service to let the user toggle
  // the visibility of the voucher registry's columns.
  /**
   *
   */
  function openColumnConfigModal() {
    // column configuration has direct access to the grid API to alter the current
    // state of the columns - this will be saved if the user saves the grid configuration
    gridColumns.openConfigurationModal();
  }

  vm.saveGridState = state.saveGridState;
  // saves the grid's current configuration
  /**
   *
   */
  function clearGridState() {
    state.clearGridState();
    $state.reload();
  }

  /**
   *
   * @param entity
   */
  function reverseVoucher(entity) {
    Vouchers.openReverseRecordModal(entity.uuid)
      .then(bool => {
        if (bool) {
          Notify.success('FORM.INFO.TRANSACTION_REVER_SUCCESS');

          // load() has it's own error handling.  The absence of return below is
          // explicit.
          load(Vouchers.filters.formatHTTP(true));
        }
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param entity
   */
  function remove(entity) {
    Vouchers.remove(entity.uuid)
      .then(() => {
        Notify.success('FORM.INFO.DELETE_RECORD_SUCCESS');

        // load() has it's own error handling.  The absence of return below is
        // explicit.
        load(Vouchers.filters.formatHTTP(true));
      })
      .catch(Notify.handleError);
  }

  // this function deletes the voucher from the database
  /**
   *
   * @param entity
   */
  function deleteVoucherWithConfirmation(entity) {
    Modals.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(isOk => {
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
        Vouchers.filters.replaceFilters([
          { key : 'uuid', value : record.uuid, displayValue : record.reference },
        ]);

        load(Vouchers.filters.formatHTTP(true));
        vm.latestViewFilters = Vouchers.filters.formatView();
      });
  }

  startup();
}
