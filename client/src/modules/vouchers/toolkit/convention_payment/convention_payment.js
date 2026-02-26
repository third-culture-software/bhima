angular.module('bhima.controllers')
  .controller('ConventionPaymentKitController', ConventionPaymentKitController);

ConventionPaymentKitController.$inject = [
  '$uibModalInstance', 'DebtorGroupService', 'NotifyService',
  'SessionService', 'bhConstants', '$translate', 'VoucherToolkitService',
];

// Import transaction rows for a convention payment
/**
 *
 * @param Instance
 * @param DebtorGroup
 * @param Notify
 * @param Session
 * @param bhConstants
 * @param $translate
 * @param ToolKits
 */
function ConventionPaymentKitController(
  Instance, DebtorGroup, Notify, Session, bhConstants, $translate, ToolKits,
) {
  const vm = this;

  const { MAX_DECIMAL_PRECISION } = bhConstants.precision;

  // global variables
  vm.debtorGroupFilter = { is_convention : 1 };
  vm.gridOptions = {};
  vm.enterprise = Session.enterprise;

  // expose to the view
  vm.selectGroupInvoices = selectGroupInvoices;
  vm.close = Instance.close;
  vm.import = submit;

  // Set up page elements data (debtor select data)
  vm.onSelectDebtor = onSelectDebtor;
  vm.onSelectCashbox = onSelectCashbox;

  /**
   *
   * @param debtorGroup
   */
  function onSelectDebtor(debtorGroup) {
    vm.convention = debtorGroup;
    selectGroupInvoices(vm.convention);
  }

  /**
   *
   * @param cashbox
   */
  function onSelectCashbox(cashbox) {
    vm.cashbox = cashbox;
  }

  // get debtor group invoices
  /**
   *
   * @param convention
   */
  function selectGroupInvoices(convention) {
    vm.loading = true;

    DebtorGroup.invoices(convention.uuid)
      .then((invoices = []) => {
        // total amount
        const total = invoices.reduce(aggregate, 0);

        invoices.forEach(invoice => {
          invoice.date = new Date(invoice.date);
        });

        // sort in order
        invoices.sort((a, b) => a.date > b.date);

        // invoices
        vm.gridOptions.data = invoices;

        // make sure we are always within precision
        vm.totalInvoices = Number.parseFloat(total.toFixed(MAX_DECIMAL_PRECISION));
      })
      .catch((err) => {
        vm.hasError = true;
        Notify.handleError(err);
      })
      .finally(() => {
        vm.loading = false;
      });
  }

  // generate transaction rows
  /**
   *
   * @param result
   */
  function generateTransactionRows(result) {
    const rows = [];

    const cashboxAccountId = result.cashbox.account_id;
    const conventionAccountId = result.convention.account_id;
    const { invoices } = result;

    // first, generate a cashbox row
    const cashboxRow = ToolKits.getBlankVoucherRow();
    cashboxRow.account_id = cashboxAccountId;
    cashboxRow.debit = vm.totalSelected;
    cashboxRow.credit = 0;
    rows.push(cashboxRow);

    // then loop through each selected item and credit it with the convention account
    invoices.forEach(invoice => {
      const row = ToolKits.getBlankVoucherRow();

      row.account_id = conventionAccountId;
      row.reference_uuid = invoice.uuid;
      row.credit = invoice.balance;

      // maybe this should be "invoice.debtor_uuid"
      row.entity_uuid = invoice.entity_uuid;
      row.document_uuid = invoice.uuid;

      // add the row in to the
      rows.push(row);
    });

    return rows;
  }

  /* ================ Invoice grid parameters ===================== */
  vm.gridOptions = {
    enableFiltering : true,
    enableColumnMenus : false,
    fastWatch : true,
    flatEntityAccess : true,
    enableSelectionBatchEvent : false,
    onRegisterApi,
  };

  vm.gridOptions.columnDefs = [{
    field : 'reference',
    displayName : 'TABLE.COLUMNS.REFERENCE',
    headerCellFilter : 'translate',
  }, {
    field : 'date',
    type : 'date',
    cellFilter : 'date',
    displayName : 'TABLE.COLUMNS.BILLING_DATE',
    headerCellFilter : 'translate',
    enableFiltering : false,
  }, {
    field : 'balance',
    type : 'number',
    displayName : 'TABLE.COLUMNS.COST',
    headerCellFilter : 'translate',
    enableFiltering : true,
    cellFilter : 'currency:'.concat(Session.enterprise.currency_id),
    cellClass : 'text-right',
  }];

  /**
   *
   * @param gridApi
   */
  function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
    vm.gridApi.selection.on.rowSelectionChanged(null, rowSelectionCallback);
  }

  // helper function for the rowSelectionCallback()
  /**
   *
   * @param sum
   * @param row
   */
  function aggregate(sum, row) {
    return sum + row.balance;
  }

  // called whenever the selection changes in the ui-grid
  /**
   *
   */
  function rowSelectionCallback() {
    const selected = vm.gridApi.selection.getSelectedRows();
    const aggregation = selected.reduce(aggregate, 0);

    vm.hasSelectedRows = selected.length > 0;
    vm.totalSelected = Number.parseFloat(aggregation.toFixed(MAX_DECIMAL_PRECISION));
  }

  /* ================ End Invoice grid parameters ===================== */

  // submission
  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) { return; }

    const selected = vm.gridApi.selection.getSelectedRows();

    const bundle = generateTransactionRows({
      cashbox    : vm.cashbox,
      convention : vm.convention,
      invoices   : selected,
    });

    Instance.close({
      rows       : bundle,
      convention : vm.convention,
      type_id    : bhConstants.transactionType.CONVENTION_PAYMENT,
      description : $translate.instant('VOUCHERS.GLOBAL.CONVENTION_PAYMENT_DESCRIPTION', {
        numInvoices : selected.length,
        debtorGroupName : vm.convention.name,
      }),
    });
  }
}
