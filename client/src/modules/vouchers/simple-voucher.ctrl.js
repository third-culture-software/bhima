angular.module('bhima.controllers')
  .controller('SimpleJournalVoucherController', SimpleJournalVoucherController);

SimpleJournalVoucherController.$inject = [
  'VoucherService', 'util', 'NotifyService', 'ReceiptModal', 'bhConstants',
  '$rootScope', 'VoucherForm', 'TransactionTypeService',
];

/**
 * @param Vouchers
 * @param util
 * @param Notify
 * @param Receipts
 * @param bhConstants
 * @param RS
 * @param VoucherForm
 * @param TransactionTypes
 * @class SimpleJournalVouchers
 *
 * This module implements simply journal vouchers, crafted specially for cash
 * transactions, but usable in any generic transactions that only require two
 * Posting Journal lines.  It allows users to quickly create transactions by
 * specifying two accounts and an amount to transfer between them.
 *
 * CONVENTION:
 *  First line (index 0) is the DEBIT side
 *  Second line (index 1) is the CREDIT side
 * @todo - Implement Voucher Templates to allow users to save pre-selected
 * @todo - use VoucherForm
 * forms (via AppCache and the breadcrumb component).
 */
function SimpleJournalVoucherController(
  Vouchers, util, Notify, Receipts, bhConstants, RS, VoucherForm, TransactionTypes,
) {
  const vm = this;

  vm.bhConstants = bhConstants;

  // bind the voucher form to the view
  vm.Voucher = new VoucherForm('SimpleVoucher');

  // global variables
  vm.timestamp = new Date();
  vm.maxLength = util.maxTextLength;

  // help to group transaction_types
  vm.groupTransactionByType = Vouchers.groupTransactionByType;
  // expose methods to the view
  vm.submit = submit;
  vm.clear = clear;

  vm.onSelectCreditAccount = onSelectCreditAccount;
  vm.onSelectDebitAccount = onSelectDebitAccount;

  TransactionTypes.read()
    .then(types => {
      vm.types = types;
    })
    .catch(Notify.handleError);

  /**
   *
   * @param account
   */
  function onSelectCreditAccount(account) {
    vm.Voucher.store.data[1].account_id = account.id;
  }

  /**
   *
   * @param account
   */
  function onSelectDebitAccount(account) {
    vm.Voucher.store.data[0].account_id = account.id;
  }

  /**
   *
   * @param form
   */
  function submit(form) {
    // stop submission if the form is invalid
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.RECORD_ERROR');
      return null;
    }

    // CONVENTION: 0 is debit, 1 is credit
    const debitRow = vm.Voucher.store.data[0];
    const creditRow = vm.Voucher.store.data[1];

    // configure as needed
    debitRow.configure({ debit : vm.amount });
    creditRow.configure({ credit : vm.amount });

    const valid = vm.Voucher.validate();

    if (!valid) {
      Notify.danger(vm.Voucher._error);
      return null;
    }

    const voucher = vm.Voucher.details;
    voucher.items = vm.Voucher.store.data;

    // submit the voucher
    return Vouchers.create(voucher)
      .then((res) => {
        Receipts.voucher(res.uuid, true);

        // clear the form to refresh it.
        clear();

        // setup the voucher object to init state
        form.$setPristine();
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function clear() {
    // current timestamp to limit date
    vm.timestamp = new Date();

    // clear the voucher
    vm.Voucher.clear();

    // amount is held outside of the voucher
    delete vm.amount;
  }

  // used for scanning barcodes
  RS.$on('voucher:configure', (evt, data) => {

    // configure the basics of the transaction type.
    vm.Voucher.details.description = data.description;
    vm.Voucher.details.type_id = data.type_id;

    vm.amount = data.amount;

    const debitRow = vm.Voucher.store.data[0];
    const creditRow = vm.Voucher.store.data[1];

    if (data.debit) {
      debitRow.configure(data.debit);
    }

    if (data.credit) {
      creditRow.configure(data.credit);
    }

    vm.Voucher.validate();
  });

  vm.onCurrencyChange = (currency) => {
    vm.Voucher.details.currency_id = currency.id;
  };

}
