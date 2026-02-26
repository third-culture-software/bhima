angular.module('bhima.controllers')
  .controller('AdvancesLoansInstallmentsKitController', AdvancesLoansInstallmentsKitController);

AdvancesLoansInstallmentsKitController.$inject = [
  '$uibModalInstance', 'NotifyService', 'SessionService', 'bhConstants',
  'VoucherToolkitService', 'EmployeeService', 'uiGridConstants', 'VoucherForm',
];

// Import transaction rows for Advances Loans Installments of Employees
/**
 *
 * @param Instance
 * @param Notify
 * @param Session
 * @param bhConstants
 * @param ToolKits
 * @param Employees
 * @param uiGridConstants
 * @param VoucherForm
 */
function AdvancesLoansInstallmentsKitController(
  Instance, Notify, Session, bhConstants, ToolKits,
  Employees, uiGridConstants, VoucherForm,
) {
  const vm = this;

  vm.LIABILITY_ACCOUNT_TYPE_ID = bhConstants.accounts.LIABILITY;
  vm.ASSET_ACCOUNT_TYPE_ID = bhConstants.accounts.ASSET;

  vm.enterprise = Session.enterprise;
  vm.onSelectCashbox = onSelectCashbox;
  vm.onSelectAccountCallback = onSelectAccountCallback;

  vm.close = Instance.close;
  vm.import = submit;

  vm.Voucher = new VoucherForm('AdvancesLoansInstallments');

  // fired on changes
  vm.onChanges = function onChanges() {
    vm.Voucher.onChanges();
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.EDIT);
  };

  vm.onCurrencyChange = function onCurrencyChange(currency) {
    vm.Voucher.handleCurrencyChange(currency.id, true);
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.EDIT);
  };

  // custom filter cashbox_id - assign the value to the searchQueries object
  /**
   *
   * @param cashbox
   */
  function onSelectCashbox(cashbox) {
    vm.currencyId = cashbox.currency_id;
    vm.account_id = cashbox.account_id;
  }

  /**
   *
   * @param account
   */
  function onSelectAccountCallback(account) {
    vm.paiementAccountId = account.id;
    vm.accountLabel = account.label;
    reloadGrid();
  }

  /**
   *
   */
  function reloadGrid() {
    if (vm.currencyId && vm.account_id && vm.paiementAccountId) {
      vm.gridDisplay = true;

      Employees.read()
        .then((employees) => {
          employees.forEach((employee) => {
            employee.currency_id = vm.currencyId;
            employee.value = 0;
          });
          // put data in the grid
          vm.gridOptions.data = employees || [];
        })
        .catch(Notify.handleError);

    } else {
      vm.gridDisplay = false;
    }

  }

  // generate transaction rows
  /**
   *
   * @param result
   */
  function generateTransactionRows(result) {
    const rows = [];

    const supportAccountId = result.account_id;
    const { payments } = result;
    const supportRow = ToolKits.getBlankVoucherRow();

    rows.typeId = bhConstants.transactionType.SALARY_PAYMENT;

    // first, generate a support row
    supportRow.account_id = supportAccountId;
    supportRow.debit = 0;
    supportRow.credit = result.totalPaiement;

    rows.push(supportRow);
    // then loop through each selected item and credit it with the Supported account
    payments.forEach((payment) => {
      const row = ToolKits.getBlankVoucherRow();
      row.account_id = payment.account_id;
      row.document_uuid = payment.payment_uuid;
      row.debit = payment.value;
      row.entity_uuid = payment.creditor_uuid;

      // add the row in to the
      rows.push(row);
    });

    return rows;
  }

  /* ================ Paiement grid parameters ===================== */

  vm.gridOptions = {
    appScopeProvider : vm,
    enableFiltering : true,
    enableSorting : false,
    fastWatch : true,
    flatEntityAccess : true,
    enableSelectionBatchEvent : false,
    showColumnFooter : true,
    onRegisterApi,
  };

  /**
   *
   * @param grid
   * @param row
   */
  function muteDisabledCells(grid, row) {
    return (row.entity.locked) ? `text-muted strike` : '';
  }

  vm.gridOptions.columnDefs = [{
    field : 'display_name',
    width : 300,
    displayName : 'FORM.LABELS.EMPLOYEE_NAME',
    headerCellFilter : 'translate',
    cellClass : muteDisabledCells,
  }, {
    field : 'value',
    displayName : 'FORM.LABELS.AMOUNT',
    headerCellFilter : 'translate',
    cellFilter : 'currency: row.entity.currency_id',
    cellTemplate : 'modules/vouchers/templates/amount_paiment.grid.tmpl.html',
    aggregationType : uiGridConstants.aggregationTypes.sum,
    footerCellFilter     : 'currency:grid.appScope.currencyId',
  }];

  /**
   *
   * @param gridApi
   */
  function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  }

  /* ================ End Paiement grid parameters ===================== */

  // submission
  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) { return; }

    const dataPaiements = [];
    let totalPaiement = 0;

    vm.gridApi.grid.rows.forEach(item => {
      if (item.entity.value > 0) {
        totalPaiement += item.entity.value;
        item.entity.account_id = vm.paiementAccountId;
        dataPaiements.push(item.entity);
      }
    });

    const bundle = generateTransactionRows({
      account_id : vm.account_id,
      totalPaiement,
      payments   : dataPaiements,
    });

    Instance.close({
      rows    : bundle,
      currency_id : vm.currencyId,
    });
  }
}
