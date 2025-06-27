angular.module('bhima.controllers')
  .controller('GenericIncomeKitController', GenericIncomeKitController);

GenericIncomeKitController.$inject = [
  '$uibModalInstance', 'NotifyService', 'CashboxService', 'bhConstants', 'VoucherToolkitService',
];

// Import transaction rows for a convention payment
function GenericIncomeKitController(Instance, Notify, Cashbox, bhConstants, ToolKits) {
  const vm = this;

  // expose to the view
  vm.close = Instance.close;
  vm.import = submit;

  vm.onSelectAccountCallback = onSelectAccountCallback;

  // load cashboxes
  Cashbox.read(null, { detailed : 1 })
    .then((data) => {
      vm.cashboxes = data;
    })
    .catch(Notify.handleError);

  function onSelectAccountCallback(account) {
    vm.account = account;
  }

  // generate transaction rows
  function generateTransactionRows(params) {
    const rows = [];

    const debitRow = ToolKits.getBlankVoucherRow();
    const creditRow = ToolKits.getBlankVoucherRow();

    const cashboxAccountId = params.cashbox.account_id;
    const selectedAccountId = params.account.id;

    // debit the cashbox
    debitRow.account_id = cashboxAccountId;
    debitRow.debit = vm.amount;
    debitRow.credit = 0;
    rows.push(debitRow);

    // credit the selected account
    creditRow.account_id = selectedAccountId;
    creditRow.debit = 0;
    creditRow.credit = vm.amount;
    rows.push(creditRow);

    return rows;
  }

  // submission
  function submit(form) {
    if (form.$invalid) { return; }

    const bundle = generateTransactionRows({
      cashbox : vm.cashbox,
      account : vm.account,
    });

    Instance.close({
      rows        : bundle,
      description : vm.description,
      type_id     : bhConstants.transactionType.GENERIC_INCOME,
      currency_id : vm.cashbox.currency_id,
    });
  }
}
