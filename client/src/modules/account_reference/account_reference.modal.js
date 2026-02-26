angular.module('bhima.controllers')
  .controller('AccountReferenceModalController', AccountReferenceModalController);

AccountReferenceModalController.$inject = [
  '$state', 'AccountService', 'AccountReferenceService',
  'NotifyService', 'appcache', 'FormatTreeDataService', 'params',
];

/**
 *
 * @param $state
 * @param Accounts
 * @param AccountReferences
 * @param Notify
 * @param AppCache
 * @param FormatTreeData
 * @param params
 */
function AccountReferenceModalController(
  $state, Accounts, AccountReferences,
  Notify, AppCache, FormatTreeData, params,
) {
  const vm = this;
  const cache = AppCache('AccountReferenceModal');

  vm.accountReference = {};

  // check if we are in the create state
  vm.isCreateState = params.isCreateState;

  // exposed methods
  vm.submit = submit;
  vm.closeModal = closeModal;
  vm.clear = clear;
  vm.onSelectAccountReferenceType = onSelectAccountReferenceType;

  if (vm.isCreateState || params.id) {
    cache.stateParams = params;
    vm.params = cache.stateParams;
  } else {
    vm.params = cache.stateParams;
  }

  if (!vm.isCreateState) {
    AccountReferences.read(vm.params.id)
      .then(reference => {
        vm.accountReference = reference;
      })
      .catch(Notify.handleError);
  } else {
    vm.accountReference.accounts = [];
    vm.accountReference.accountsException = [];
  }

  // load accounts
  Accounts.read(null, { locked : 0, hidden : 0 })
    .then(elements => {
      vm.accounts = FormatTreeData.order(elements);
    })
    .catch(Notify.handleError);

  // load accounts references
  AccountReferences.read()
    .then(references => {
      vm.references = references;
    })
    .catch(Notify.handleError);

  // callback for Account Reference Type
  /**
   *
   * @param referenceType
   */
  function onSelectAccountReferenceType(referenceType) {
    vm.accountReference.reference_type_id = referenceType.id;
  }

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param accountReferenceForm
   */
  function submit(accountReferenceForm) {
    if (accountReferenceForm.$invalid) { return null; }
    // Fixe me @lomamech : Give the possibility to validate the modification
    // of the 'Parent' or 'Account Reference Type Only' input area only

    if (accountReferenceForm.$pristine) { return null; }

    const promise = (vm.isCreateState)
      ? AccountReferences.create(vm.accountReference)
      : AccountReferences.update(vm.accountReference.id, vm.accountReference);

    return promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'ACCOUNT.REFERENCE.CREATED' : 'ACCOUNT.REFERENCE.UPDATED';
        Notify.success(translateKey);
        $state.go('account_reference.list', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param value
   */
  function clear(value) {
    vm.accountReference[value] = null;
  }

  /**
   *
   */
  function closeModal() {
    $state.go('account_reference.list');
  }
}
