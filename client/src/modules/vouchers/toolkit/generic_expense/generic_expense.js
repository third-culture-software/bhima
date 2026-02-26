angular.module('bhima.controllers')
  .controller('GenericExpenseKitController', GenericExpenseKitController);

GenericExpenseKitController.$inject = [
  '$uibModalInstance', 'NotifyService', 'CashboxService', 'bhConstants', 'VoucherToolkitService',
];

// Import transaction rows for a convention payment
/**
 *
 * @param Instance
 * @param Notify
 * @param Cashbox
 * @param bhConstants
 * @param ToolKits
 */
function GenericExpenseKitController(Instance, Notify, Cashbox, bhConstants, ToolKits) {
  const vm = this;

  // expose to the view
  vm.close = Instance.close;
  vm.import = submit;

  vm.onSelectAccountCallback = onSelectAccountCallback;

  Cashbox.read(null, { detailed : 1 })
    .then((data) => {
      vm.cashboxes = data;
    })
    .catch(Notify.handleError);

  // generate transaction rows
  /**
   *
   * @param params
   */
  function generateTransactionRows(params) {
    const rows = [];

    const debitRow = ToolKits.getBlankVoucherRow();
    const creditRow = ToolKits.getBlankVoucherRow();

    const cashboxAccountId = params.cashbox.account_id;
    const selectedAccountId = params.account.id;

    // debit the selected account
    debitRow.account_id = selectedAccountId;
    debitRow.debit = vm.amount;
    debitRow.credit = 0;
    rows.push(debitRow);

    // credit the cash box
    creditRow.account_id = cashboxAccountId;
    creditRow.debit = 0;
    creditRow.credit = vm.amount;
    rows.push(creditRow);

    return rows;
  }

  /**
   *
   * @param account
   */
  function onSelectAccountCallback(account) {
    vm.account = account;
  }

  // submission
  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) { return; }

    const bundle = generateTransactionRows({
      cashbox : vm.cashbox,
      account : vm.account,
    });

    Instance.close({
      rows        : bundle,
      description : vm.description,
      type_id     : bhConstants.transactionType.GENERIC_EXPENSE,
      currency_id : vm.cashbox.currency_id,
    });
  }
}
