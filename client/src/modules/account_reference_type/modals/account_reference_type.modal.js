angular.module('bhima.controllers')
  .controller('AccountReferenceTypeModalController', AccountReferenceTypeModalController);

AccountReferenceTypeModalController.$inject = [
  '$state', 'AccountReferenceTypeService', 'NotifyService', 'appcache', 'params',
];

/**
 * Account Reference Type Modal Controller
 */

/**
 *
 * @param $state
 * @param AccountReferenceType
 * @param Notify
 * @param AppCache
 * @param params
 */
function AccountReferenceTypeModalController($state, AccountReferenceType, Notify, AppCache, params) {
  const vm = this;
  const cache = AppCache('AccountReferenceTypeModal');

  vm.types = {};
  vm.stateParams = {};

  // exposed methods
  vm.submit = submit;
  vm.closeModal = closeModal;
  vm.clear = clear;

  vm.isCreateState = params.isCreateState;

  if (params.isCreateState || params.id) {
    cache.stateParams = params;
    vm.stateParams = cache.stateParams;
  } else {
    vm.stateParams = cache.stateParams;
  }

  if (!vm.isCreateState) {
    AccountReferenceType.read(vm.stateParams.id)
      .then(data => {
        vm.types = data;
      })
      .catch(Notify.handleError);
  }

  // load Account Reference Type
  AccountReferenceType.read()
    .then(ReferencesType => {
      vm.ReferencesType = ReferencesType;
    })
    .catch(Notify.handleError);

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param accountReferenceTypeForm
   */
  function submit(accountReferenceTypeForm) {
    vm.hasNoChange = accountReferenceTypeForm.$submitted && accountReferenceTypeForm.$pristine && !vm.isCreateState;

    if (accountReferenceTypeForm.$invalid || accountReferenceTypeForm.$pristine) { return null; }

    const promise = (vm.isCreateState)
      ? AccountReferenceType.create(vm.types)
      : AccountReferenceType.update(vm.types.id, vm.types);

    return promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'FORM.INFO.CREATE_SUCCESS' : 'FORM.INFO.UPDATE_SUCCESS';
        Notify.success(translateKey);
        $state.go('account_reference_type', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param value
   */
  function clear(value) {
    vm.types[value] = null;
  }

  /**
   *
   */
  function closeModal() {
    $state.go('account_reference_type');
  }
}
