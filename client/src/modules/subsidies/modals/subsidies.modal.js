angular.module('bhima.controllers')
  .controller('SubsidyModalController', SubsidyModalController);

SubsidyModalController.$inject = [
  '$state', 'SubsidyService', 'NotifyService', 'params',
];

/**
 *
 * @param $state
 * @param Subsidy
 * @param Notify
 * @param params
 */
function SubsidyModalController($state, Subsidy, Notify, params) {
  const vm = this;

  vm.identifier = params.id;
  vm.isCreateState = params.isCreateState;

  // exposed methods
  vm.submit = submit;
  vm.onAccountSelect = onAccountSelect;

  /**
   *
   * @param account
   */
  function onAccountSelect(account) {
    vm.subsidy.account_id = account.id;
  }

  /**
   *
   */
  function startup() {
    if (!vm.isCreateState) {
      Subsidy.read(vm.identifier)
        .then(subsidy => {
          vm.subsidy = subsidy;
        })
        .catch(Notify.handleError);
    } else {
      vm.subsidy = {};
    }
  }

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param subsidyForm
   */
  function submit(subsidyForm) {
    if (subsidyForm.$invalid) {
      return;
    }

    if (subsidyForm.$pristine) {
      cancel();
      return;
    }

    const subsidy = angular.copy(vm.subsidy);
    const promise = (vm.isCreateState)
      ? Subsidy.create(subsidy)
      : Subsidy.update(subsidy.id, subsidy);

    promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'SUBSIDY.CREATED' : 'SUBSIDY.UPDATED';
        Notify.success(translateKey);
        $state.go('subsidies', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function cancel() {
    $state.go('subsidies');
  }

  startup();
}
