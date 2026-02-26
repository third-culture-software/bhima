angular.module('bhima.controllers')
  .controller('ComplexJournalVoucherController', ComplexJournalVoucherController);

ComplexJournalVoucherController.$inject = [
  'VoucherService', 'CurrencyService', 'SessionService', 'NotifyService',
  'VoucherToolkitService', 'ReceiptModal', 'bhConstants', 'uiGridConstants',
  'VoucherForm', '$timeout', 'ExchangeRateService', 'TransactionTypeService',
];

/**
 * @param Vouchers
 * @param Currencies
 * @param Session
 * @param Notify
 * @param Toolkit
 * @param Receipts
 * @param bhConstants
 * @param uiGridConstants
 * @param VoucherForm
 * @param $timeout
 * @param Rates
 * @param TransactionTypes
 * @file ComplexJournalVoucherController
 * @description
 * This module implements complex journal vouchers. It allows users to quickly create transactions by
 * specifying two or more lines of transactions and all relative document references
 * @class
 */
function ComplexJournalVoucherController(
  Vouchers, Currencies, Session, Notify, Toolkit, Receipts, bhConstants,
  uiGridConstants, VoucherForm, $timeout, Rates, TransactionTypes,
) {
  const vm = this;

  // help to group transaction_types
  vm.groupTransactionByType = Vouchers.groupTransactionByType;

  // bind constants
  vm.bhConstants = bhConstants;
  vm.enterprise = Session.enterprise;
  vm.itemIncrement = 1;
  vm.timestamp = new Date();

  // bind the complex voucher form
  vm.Voucher = new VoucherForm('ComplexVouchers');

  // fired to clear the grid
  vm.clear = function clear(form) {
    vm.Voucher.clear();
    form.$setPristine();
  };

  // fired on changes
  vm.onChanges = function onChanges() {
    vm.Voucher.onChanges();
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.EDIT);
  };

  vm.onCurrencyChange = function onCurrencyChange(currency) {
    vm.Voucher.handleCurrencyChange(currency.id, true);
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.EDIT);
  };

  // ui-grid options
  vm.gridOptions = {
    appScopeProvider  : vm,
    flatEntityAccess  : true,
    fastWatch         : true,
    enableSorting     : false,
    enableColumnMenus : false,
    showColumnFooter  : true,
    virtualizationThreshold : 200,
    onRegisterApi,
  };

  /**
   *
   * @param api
   */
  function onRegisterApi(api) {
    vm.gridApi = api;
  }

  vm.openConventionPaymentModal = function openConventionPaymentModal() {
    gridManager(Toolkit.openConventionPaymentModal);
  };

  vm.openPatientFledModal = function openPatientFledModal() {
    gridManager(Toolkit.openPatientFledModal);
  };

  vm.openGenericIncomeModal = function openGenericIncomeModal() {
    gridManager(Toolkit.openGenericIncomeModal);
  };

  vm.openGenericExpenseModal = function openGenericExpenseModal() {
    gridManager(Toolkit.openGenericExpenseModal);
  };

  vm.openCashTransferModal = function openCashTransferModal() {
    gridManager(Toolkit.openCashTransferModal);
  };

  vm.openSupportPatientModal = function openSupportPatientModal() {
    gridManager(Toolkit.openSupportPatientModal);
  };

  vm.openPaymentEmployees = function openPaymentEmployees() {
    gridManager(Toolkit.openPaymentEmployees);
  };

  vm.openAdvancesLoansInstallments = function openAdvancesLoansInstallments() {
    gridManager(Toolkit.openAdvancesLoansInstallments);
  };

  // @TODO fixed me to display correctly selected items(invoices, ..) accounts
  // without adding empty items before
  /**
   *
   * @param modal
   */
  function gridManager(modal) {
    modal()
      .then(result => {
        if (!result) {
          removeNullRows();

          if (vm.Voucher.store.data.length === 0) {
            vm.Voucher.addItems(2);
          }

          return;
        }

        processVoucherToolRows(result);
      });
  }
  /**
   * @param result
   * @function processVoucherToolRows
   * @description this function handle the result of the tool modal
   */
  function processVoucherToolRows(result) {
    if (!result) { return; }

    // force updating details
    vm.Voucher.replaceFormRows(result.rows);

    updateView(result);
  }

  /**
   * @function updateView
   * @description
   * this function force to update details of the voucher
   * and remove unnecessary rows
   * @param {object} result
   */
  function updateView(result) {
    $timeout(() => {
      // transaction type
      vm.Voucher.details.type_id = result.type_id || vm.Voucher.details.type_id;

      // description
      vm.Voucher.description(result.description || vm.Voucher.details.description);

      // currency
      vm.Voucher.details.currency_id = result.currency_id || vm.Voucher.details.currency_id;

      removeNullRows();
    }, 0);
  }

  /**
   * @function removeNullRows
   * @description remove null rows
   */
  function removeNullRows() {
    const gridData = JSON.parse(JSON.stringify(vm.gridOptions.data));
    gridData.forEach(item => {
      if (!item.account_id) {
        vm.Voucher.store.remove(item.uuid);
      }
    });
  }

  /** ======================== end voucher tools ======================= */

  // bind the startup method as a reset method
  vm.submit = submit;
  vm.currencySymbol = currencySymbol;

  /**
   * Get the selected currency symbol
   * @param currencyId
   */
  function currencySymbol(currencyId) {
    if (!currencyId) { return ''; }
    return Currencies.symbol(currencyId);
  }

  /** run the module on startup and refresh */
  function startup() {
    vm.gridOptions.data = vm.Voucher.store.data;

    // NOTE(@jniles) - is this really a good idea?!
    // queue the exchange rate download
    Rates.read(true);
  }

  /* ============================= Transaction Type ============================= */

  TransactionTypes.read()
    .then(types => {
      vm.types = types;
    })
    .catch(Notify.handleError);

  /* ============================= Grid ====================================== */

  // grid default options
  vm.gridOptions.columnDefs = [{
    field                : 'isValid',
    displayName          : '...',
    cellTemplate         : 'modules/vouchers/templates/status.grid.tmpl.html',
    aggregationType      : uiGridConstants.aggregationTypes.count,
    aggregationHideLabel : true,
    footerCellClass      : 'text-center',
    width                : 40,
  }, {
    field            : 'account',
    displayName      : 'FORM.LABELS.ACCOUNT',
    headerCellFilter : 'translate',
    cellTemplate     : 'modules/vouchers/templates/account.grid.tmpl.html',
    width            : '35%',
  }, {
    field                : 'debit',
    displayName          : 'FORM.LABELS.DEBIT',
    headerCellFilter     : 'translate',
    cellTemplate         : 'modules/vouchers/templates/debit.grid.tmpl.html',
    aggregationType      : uiGridConstants.aggregationTypes.sum,
    aggregationHideLabel : true,
    footerCellFilter     : 'currency:grid.appScope.Voucher.details.currency_id',
    footerCellClass      : 'text-right',
  }, {
    field                : 'credit',
    displayName          : 'FORM.LABELS.CREDIT',
    headerCellFilter     : 'translate',
    cellTemplate         : 'modules/vouchers/templates/credit.grid.tmpl.html',
    aggregationType      : uiGridConstants.aggregationTypes.sum,
    aggregationHideLabel : true,
    footerCellFilter     : 'currency:grid.appScope.Voucher.details.currency_id',
    footerCellClass      : 'text-right',
  }, {
    field            : 'entity',
    displayName      : 'FORM.LABELS.DEBTOR_CREDITOR',
    headerCellFilter : 'translate',
    cellTemplate     : 'modules/vouchers/templates/entity.grid.tmpl.html',
  }, {
    field            : 'reference',
    displayName      : 'FORM.LABELS.REFERENCE',
    headerCellFilter : 'translate',
    cellTemplate     : 'modules/vouchers/templates/reference.grid.tmpl.html',
  }, {
    field        : 'action',
    displayName  : '...',
    width        : 25,
    cellTemplate : 'modules/vouchers/templates/remove.grid.tmpl.html',
  }];

  /* ============================= End Grid ================================== */

  /**
   * submit data
   * @param form
   */
  function submit(form) {
    // stop submission if the form is invalid
    if (form.$invalid) {
      return Notify.danger('VOUCHERS.COMPLEX.INVALID_VALUES');
    }

    const valid = vm.Voucher.validate();

    if (!valid) {
      return Notify.danger(vm.Voucher._error);
    }

    const voucher = vm.Voucher.details;
    voucher.items = vm.Voucher.store.data;

    return Vouchers.create(voucher)
      .then(result => {
        Receipts.voucher(result.uuid, true);
        vm.Voucher.clear();
        form.$setPristine();
      })
      .catch(Notify.handleError);
  }

  vm.onSelectEntity = (row, entity) => {
    row.entity.entity_uuid = entity.uuid;
  };

  vm.onSelectRecord = (row, record) => {
    row.entity.document_uuid = record.uuid;
  };

  startup();
}
