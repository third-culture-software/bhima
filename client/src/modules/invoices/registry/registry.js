angular.module('bhima.controllers')
  .controller('InvoiceRegistryController', InvoiceRegistryController);

InvoiceRegistryController.$inject = [
  'PatientInvoiceService', 'bhConstants', 'NotifyService', 'SessionService',
  'ReceiptModal', 'uiGridConstants', 'ModalService', 'GridSortingService',
  'GridColumnService', 'GridStateService', '$state', 'ModalService',
  'ReceiptModal', 'util', 'BarcodeService',
];

/**
 * Invoice Registry Controller
 * @param Invoices
 * @param bhConstants
 * @param Notify
 * @param Session
 * @param Receipt
 * @param uiGridConstants
 * @param ModalService
 * @param Sorting
 * @param Columns
 * @param GridState
 * @param $state
 * @param Modals
 * @param Receipts
 * @param util
 * @param Barcode
 * @description
 * This module is responsible for the management of Invoice Registry.
 */
function InvoiceRegistryController(
  Invoices, bhConstants, Notify, Session, Receipt, uiGridConstants,
  ModalService, Sorting, Columns, GridState, $state, Modals, Receipts, util,
  Barcode,
) {
  const vm = this;

  // Background color for make the difference between the valid and cancel invoice
  const cacheKey = 'invoice-grid';

  vm.search = search;
  vm.creditNoteReceipt = Receipt.creditNote;
  vm.onRemoveFilter = onRemoveFilter;
  vm.creditNote = creditNote;
  vm.bhConstants = bhConstants;
  vm.download = Invoices.download;
  vm.deleteInvoice = deleteInvoiceWithConfirmation;
  vm.Receipts = Receipts;
  vm.toggleInlineFilter = toggleInlineFilter;
  vm.openCronEmailModal = openCronEmailModal;

  // date format function
  vm.format = util.formatDate;
  vm.openBarcodeScanner = openBarcodeScanner;

  // track if module is making a HTTP request for invoices
  vm.loading = false;
  vm.enterprise = Session.enterprise;

  const columnDefs = [{
    field : 'reference',
    displayName : 'TABLE.COLUMNS.REFERENCE',
    headerCellFilter : 'translate',
    aggregationType : uiGridConstants.aggregationTypes.count,
    aggregationHideLabel : true,
    footerCellClass : 'text-center',
    cellTemplate : '/modules/invoices/registry/templates/reference.html',
    sortingAlgorithm : Sorting.algorithms.sortByReference,
  }, {
    field : 'date',
    cellFilter : 'date',
    displayName : 'TABLE.COLUMNS.BILLING_DATE',
    headerCellFilter : 'translate',
    type : 'date',
    cellTemplate : '/modules/invoices/registry/templates/date.cell.html',
  }, {
    field : 'created_at',
    type : 'date',
    displayName : 'FORM.LABELS.SERVER_DATE',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/journal/templates/created_at.cell.html',
    visible : false,
  }, {
    name : 'patientName',
    displayName : 'TABLE.COLUMNS.PATIENT',
    headerCellFilter : 'translate',
  }, {
    field : 'cost',
    displayName : 'TABLE.COLUMNS.COST',
    headerCellFilter : 'translate',
    cellClass : 'text-right',
    cellFilter : 'currency:'.concat(Session.enterprise.currency_id),
    aggregationType : uiGridConstants.aggregationTypes.sum,
    aggregationHideLabel : true,
    footerCellClass : 'text-right',
    type : 'number',
    footerCellFilter : 'currency:'.concat(Session.enterprise.currency_id),
  }, {
    field : 'description',
    displayName : 'FORM.LABELS.DESCRIPTION',
    headerCellFilter : 'translate',
  }, {
    field : 'project_name',
    displayName : 'TABLE.COLUMNS.PROJECT',
    headerCellFilter : 'translate',
  }, {
    field : 'serviceName',
    displayName : 'TABLE.COLUMNS.SERVICE',
    headerCellFilter : 'translate',
  }, {
    field : 'display_name',
    displayName : 'TABLE.COLUMNS.BY',
    headerCellFilter : 'translate',
  }, {
    name : 'credit_action',
    displayName : '',
    enableFiltering     : false,
    cellTemplate : '/modules/invoices/registry/templates/action.cell.html',
    enableSorting : false,
  }];

  // setting columns names
  vm.uiGridOptions = {
    appScopeProvider  : vm,
    showColumnFooter  : true,
    enableColumnMenus : false,
    enableSorting     : true,
    fastWatch         : true,
    flatEntityAccess  : true,
    rowTemplate       : '/modules/templates/row.reversed.html',
    columnDefs,
  };
  vm.uiGridOptions.onRegisterApi = function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  };

  const gridColumns = new Columns(vm.uiGridOptions, cacheKey);
  const state = new GridState(vm.uiGridOptions, cacheKey);

  /**
   *
   * @param error
   */
  function handler(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  /**
   *
   */
  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  // this function loads invoices from the database with search parameters
  // if passed in.
  /**
   *
   * @param filters
   */
  function load(filters) {
    // flush error and loading states
    vm.hasError = false;
    toggleLoadingIndicator();

    // if we have search parameters and read invoices.
    const request = Invoices.read(null, filters);

    // hook the returned patients up to the grid.
    request
      .then(invoices => {
        // put data in the grid
        vm.uiGridOptions.data = invoices;
      })
      .catch(handler)
      .finally(() => {
        toggleLoadingIndicator();
      });
  }

  // search and filter data in Invoice Registry
  /**
   *
   */
  function search() {
    const filtersSnapshot = Invoices.filters.formatHTTP();

    Invoices.openSearchModal(filtersSnapshot)
      .then(changes => {
        if (!changes) {
          return 0;
        }
        Invoices.filters.replaceFilters(changes);

        Invoices.cacheFilters();
        vm.latestViewFilters = Invoices.filters.formatView();
        return load(Invoices.filters.formatHTTP(true));
      });
  }

  // remove a filter with from the filter object, save the filters and reload
  /**
   *
   * @param key
   */
  function onRemoveFilter(key) {
    Invoices.removeFilter(key);
    Invoices.cacheFilters();
    vm.latestViewFilters = Invoices.filters.formatView();
    return load(Invoices.filters.formatHTTP(true));
  }

  // startup function. Checks for cached filters and loads them.  This behavior could be changed.
  /**
   *
   */
  function startup() {
    if ($state.params.filters.length) {
      Invoices.filters.replaceFiltersFromState($state.params.filters);
      Invoices.cacheFilters();
    }

    load(Invoices.filters.formatHTTP(true));
    vm.latestViewFilters = Invoices.filters.formatView();
  }

  // This function opens a modal through column service to let the user toggle
  // the visibility of the invoice registry's columns.
  vm.openColumnConfigModal = function openColumnConfigModal() {
    // column configuration has direct access to the grid API to alter the current
    // state of the columns - this will be saved if the user saves the grid configuration
    gridColumns.openConfigurationModal();
  };

  // saves the grid's current configuration
  vm.saveGridState = state.saveGridState;
  vm.clearGridState = function clearGridState() {
    state.clearGridState();
    $state.reload();
  };

  // Function for Credit Note cancel all Invoice
  /**
   *
   * @param invoice
   */
  function creditNote(invoice) {
    Invoices.openCreditNoteModal(invoice)
      .then(success => {
        if (success) {
          Notify.success('FORM.INFO.TRANSACTION_REVER_SUCCESS');
          load(Invoices.filters.formatHTTP(true));
        }
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param entity
   */
  function remove(entity) {
    Invoices.remove(entity.uuid)
      .then(() => {
        Notify.success('FORM.INFO.DELETE_RECORD_SUCCESS');

        // load() has it's own error handling.  The absence of return below is
        // explicit.
        load(Invoices.filters.formatHTTP(true));
      })
      .catch(Notify.handleError);
  }

  // check if it is okay to remove the entity.
  /**
   *
   * @param entity
   */
  function deleteInvoiceWithConfirmation(entity) {
    Modals.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(isOk => {
        if (isOk) { remove(entity); }
      });
  }

  /**
   *
   */
  function toggleInlineFilter() {
    vm.uiGridOptions.enableFiltering = !vm.uiGridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  /**
   *
   */
  function openCronEmailModal() {
    return Modals.openCronEmailModal({
      reportKey : 'invoiceRegistryReport',
      details : Invoices.filters.formatHTTP(true),
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
        Invoices.filters.replaceFilters([
          { key : 'uuid', value : record.uuid, displayValue : record.reference },
        ]);

        load(Invoices.filters.formatHTTP(true));
        vm.latestViewFilters = Invoices.filters.formatView();
      });
  }

  // fire up the module
  startup();
}
