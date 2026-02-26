angular.module('bhima.controllers')
  .controller('PatientFledKitController', PatientFledKitController);

PatientFledKitController.$inject = [
  '$uibModalInstance', 'DebtorService', 'NotifyService',
  'SessionService', 'bhConstants', '$translate', 'VoucherToolkitService',
];

// Import transaction rows for writting off patient invoices
/**
 *
 * @param Instance
 * @param Debtor
 * @param Notify
 * @param Session
 * @param bhConstants
 * @param $translate
 * @param ToolKits
 */
function PatientFledKitController(
  Instance, Debtor, Notify, Session, bhConstants, $translate, ToolKits,
) {
  const vm = this;

  const { MAX_DECIMAL_PRECISION } = bhConstants.precision;

  // global variables
  vm.gridOptions = {};
  vm.account = {};
  vm.enterprise = Session.enterprise;

  // expose to the view
  vm.selectGroupInvoices = selectGroupInvoices;
  vm.close = Instance.close;
  vm.import = submit;

  // Set up page elements data (debtor select data)
  vm.onSelectPatient = onSelectPatient;
  vm.onSelectAccount = onSelectAccount;

  /**
   *
   * @param patient
   */
  function onSelectPatient(patient) {
    vm.patient = patient;
    selectGroupInvoices(vm.patient);
  }

  /**
   *
   * @param account
   */
  function onSelectAccount(account) {
    vm.account.id = account.id;
  }

  // get debtor group invoices
  /**
   *
   * @param patient
   */
  function selectGroupInvoices(patient) {
    vm.loading = true;

    Debtor.invoices(patient.debtor_uuid)
      .then((invoices = []) => {
        // total amount
        const total = invoices.reduce(aggregate, 0);

        invoices.forEach(invoice => {
          invoice.date = new Date(invoice.date);
        });

        // sort in order
        invoices.sort((a, b) => a.date > b.date);

        // invoices
        vm.gridOptions.data = invoices.filter(inv => {
          return inv.balance > 0;
        });

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

    const accountId = vm.account.id;
    const patientAccountId = result.patient.account_id;
    const { invoices } = result;

    const line = ToolKits.getBlankVoucherRow();
    line.account_id = accountId;
    line.debit = vm.totalSelected;
    line.credit = 0;
    rows.push(line);

    // then loop through each selected item and credit it with the patient account
    invoices.forEach(invoice => {
      const row = ToolKits.getBlankVoucherRow();

      row.account_id = patientAccountId;
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
      patient : vm.patient,
      invoices   : selected,
    });

    Instance.close({
      rows       : bundle,
      patient : vm.patient,
      type_id    : bhConstants.transactionType.GENERIC_EXPENSE,
      description : $translate.instant('VOUCHERS.GLOBAL.WRITE_OFF_PATIENT_INVOICES_DESC', {
        numInvoices : selected.length,
        patientName : vm.patient.name,
      }),
    });
  }
}
