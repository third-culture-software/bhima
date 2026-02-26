angular.module('bhima.controllers')
  .controller('CashTransferKitController', CashTransferKitController);

// DI definition
CashTransferKitController.$inject = [
  '$uibModalInstance', 'NotifyService', 'CashboxService', '$translate', 'bhConstants', 'VoucherToolkitService',
];

// Import transaction rows for a convention payment
/**
 *
 * @param Instance
 * @param Notify
 * @param Cashbox
 * @param $translate
 * @param bhConstants
 * @param ToolKits
 */
function CashTransferKitController(Instance, Notify, Cashbox, $translate, bhConstants, ToolKits) {
  const vm = this;

  vm.onSelectAccountCallback = onSelectAccountCallback;

  // expose to the view
  vm.close = Instance.close;
  vm.import = submit;

  // load cashboxes
  // FIXME(@jniles) - why do we need to set is_auxiliary to be 0?
  Cashbox.read(null, { detailed : 1, is_auxiliary : 0 })
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

  // called when an account has been selected from the view
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

    const msg = $translate.instant('VOUCHERS.GLOBAL.TRANSFER_DESCRIPTION', {
      fromAccount : vm.account.label,
      toAccount   : vm.cashbox.label,
      amount      : vm.amount,
      symbol      : vm.cashbox.symbol,
    });

    Instance.close({
      rows        : bundle,
      description : msg,
      type_id     : bhConstants.transactionType.TRANSFER,
      currency_id : vm.cashbox.currency_id,
    });
  }
}
