angular.module('bhima.controllers')
  .controller('CashboxCurrencyModalController', CashboxCurrencyModalController);

CashboxCurrencyModalController.$inject = [
  '$uibModalInstance', 'AccountService', 'CashboxService', 'currency',
  'cashbox', 'NotifyService',
];

/**
 * @param ModalInstance
 * @param Accounts
 * @param Cashboxes
 * @param currency
 * @param cashbox
 * @param Notify
 * @function CashboxCurrencyModalController
 * @description
 * This modal is responsible for creating the currency infrastructure behind
 * cashboxes.  Each cashbox must have a currency-ed account defined for each currency
 * supported by the application.
 */
function CashboxCurrencyModalController(ModalInstance, Accounts, Cashboxes, currency, cashbox, Notify) {
  const vm = this;

  // default to an empty array;
  vm.data = { currency_id : currency.id };

  // if a currency matches, we are updating.  Otherwise, we are creating.
  const currencyIds = cashbox.currencies.map(row => row.currency_id);

  // determine whether we will send a POST or a PUT request to the server
  const method = currencyIds.includes(currency.id)
    ? 'update'
    : 'create';

  // bind data
  vm.currency = currency;
  vm.cashbox = cashbox;

  Cashboxes.currencies.read(cashbox.id, currency.id)
    .then(data => {
      vm.data = data;
      vm.data.currency_id = currency.id;
    })
    // if no accounts found, no problem!  We are in the "create" state then.
    .catch(angular.noop);

  vm.onSelectCashAccount = onSelectCashAccount;
  vm.onSelectTransferAccount = onSelectTransferAccount;

  // bind methods to the view-model
  vm.dismiss = ModalInstance.dismiss;
  vm.submit = submit;

  // callback for currency account
  /**
   *
   * @param account
   */
  function onSelectCashAccount(account) {
    vm.data.account_id = account.id;
  }

  // callback for transfer account
  /**
   *
   * @param account
   */
  function onSelectTransferAccount(account) {
    vm.data.transfer_account_id = account.id;
  }

  // submit to the server
  /**
   *
   * @param form
   */
  function submit(form) {

    // if the form has errors, exit immediately
    if (form.$invalid) { return null; }

    // if the form was never touched, just dismiss it.
    if (form.$pristine) { vm.dismiss(); }

    // send either a create or an update request to the server
    const promise = (method === 'create')
      ? Cashboxes.currencies.create(vm.cashbox.id, vm.data)
      : Cashboxes.currencies.update(vm.cashbox.id, vm.data);

    // upon successful completion, close the modal or error out
    return promise
      .then(() => { ModalInstance.close(); })
      .catch(Notify.handleError);
  }
}
