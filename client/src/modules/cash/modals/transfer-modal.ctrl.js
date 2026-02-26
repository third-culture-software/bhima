angular.module('bhima.controllers')
  .controller('CashTransferModalController', CashTransferModalController);

CashTransferModalController.$inject = [
  'CurrencyService', 'VoucherService', 'CashboxService', 'AccountService', 'SessionService',
  'CashService', '$state', 'NotifyService', 'ReceiptModal', 'bhConstants', 'VoucherForm',
];

/**
 * @param Currencies
 * @param Vouchers
 * @param Cashboxes
 * @param Accounts
 * @param Session
 * @param Cash
 * @param $state
 * @param Notify
 * @param Receipts
 * @param bhConstants
 * @param VoucherForm
 * @module CashTransferModalController
 * @description
 * This controller is responsible transferring money between a cashbox and a transfer account.
 */
function CashTransferModalController(
  Currencies, Vouchers, Cashboxes, Accounts, Session, Cash, $state, Notify,
  Receipts, bhConstants, VoucherForm,
) {
  const vm = this;

  vm.voucher = new VoucherForm('CashTransferForm');

  const TRANSFER_TYPE_ID = bhConstants.transactionType.TRANSFER;

  vm.loadAccountDetails = loadAccountDetails;
  vm.submit = submit;

  // submit and close the modal
  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) { return 0; }

    const record = prepareVoucherRecord();

    // validate
    const validation = vm.voucher.validate();
    if (!validation) { return 0; }

    return Vouchers.create(record)
      .then((response) => {
        Notify.success('CASH.TRANSFER.SUCCESS');
        return Receipts.voucher(response.uuid, true);
      })
      .then(() => {
        return $state.go('^.window', { id : $state.params.id });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function prepareVoucherRecord() {

    // extract the voucher from the VoucherForm
    const record = vm.voucher.details;
    record.items = vm.voucher.store.data;

    // configure the debits/credits appropriately

    const debit = record.items[0];
    debit.configure({ debit : vm.amount, account_id : vm.transferAccount.id });

    const credit = record.items[1];
    credit.configure({ credit : vm.amount, account_id : vm.cashAccount.id });

    // format voucher description as needed
    vm.voucher.description('CASH.TRANSFER.DESCRIPTION', {
      amount : vm.amount,
      fromLabel : vm.cashAccount.label,
      toLabel : vm.transferAccount.label,
      userName : Session.user.display_name,
    });

    return record;
  }

  // this object retains a mapping of the currency ids to their respective accounts.
  let cashCurrencyMap = {};

  // this function maps the accounts to their respective currencies.
  // { currency_id :  { currency_id, account_id, transfer_account_id } }
  /**
   *
   * @param currencies
   */
  function mapCurrenciesToAccounts(currencies) {
    return currencies.reduce((map, currency) => {
      map[currency.currency_id] = currency;
      return map;
    }, {});
  }

  // fired on state startup
  /**
   *
   */
  function startup() {

    // set the transaction type id
    vm.voucher.details.type_id = TRANSFER_TYPE_ID;

    // load needed modules
    Currencies.read()
      .then((currencies) => {
        vm.currencies = currencies;
        return Cashboxes.read($state.params.id);
      })
      .then((cashbox) => {
        vm.cashbox = cashbox;
        vm.disabledCurrencyIds = Cash.calculateDisabledIds(cashbox, vm.currencies);

        // load the accounts up for the voucher currency
        loadAccountDetails({ id : vm.voucher.details.currency_id });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param currency
   */
  function loadAccountDetails(currency) {
    const selectedCurrencyId = currency.id;

    // create the cashCurrencyMap
    cashCurrencyMap = mapCurrenciesToAccounts(vm.cashbox.currencies);

    // pull the accounts from the cashCurrencyMap
    const accounts = cashCurrencyMap[selectedCurrencyId];

    // look up the transfer account
    Accounts.read(accounts.transfer_account_id)
      .then((account) => {
        account.hrlabel = Accounts.label(account);
        vm.transferAccount = account;
      })
      .catch(Notify.handleError);

    // look up the cash account
    Accounts.read(accounts.account_id)
      .then((account) => {
        account.hrlabel = Accounts.label(account);
        vm.cashAccount = account;
      })
      .catch(Notify.handleError);
  }

  startup();
}
