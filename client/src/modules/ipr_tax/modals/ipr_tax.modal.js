angular.module('bhima.controllers')
  .controller('IprTaxModalController', IprTaxModalController);

IprTaxModalController.$inject = [
  '$state', 'IprTaxService', 'NotifyService', 'appcache', 'params',
];

/**
 *
 * @param $state
 * @param IprTaxes
 * @param Notify
 * @param AppCache
 * @param params
 */
function IprTaxModalController($state, IprTaxes, Notify, AppCache, params) {
  const vm = this;
  vm.iprTax = {};

  const cache = AppCache('IprTaxModal');

  if (params.isCreateState || params.id) {
    vm.stateParams = params;
    cache.stateParams = params;

  } else {
    vm.stateParams = cache.stateParams;
  }

  vm.isCreateState = vm.stateParams.isCreateState;

  // exposed methods
  vm.submit = submit;

  if (!vm.isCreateState) {
    IprTaxes.read(vm.stateParams.id)
      .then((iprTax) => {
        vm.iprTax = iprTax;
      })
      .catch(Notify.handleError);
  }

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param iprTaxForm
   */
  function submit(iprTaxForm) {

    if (iprTaxForm.$invalid) { return 0; }

    delete vm.iprTax.symbol;

    const promise = (vm.isCreateState)
      ? IprTaxes.create(vm.iprTax)
      : IprTaxes.update(vm.iprTax.id, vm.iprTax);

    return promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'FORM.INFO.CREATE_SUCCESS' : 'FORM.INFO.UPDATE_SUCCESS';
        Notify.success(translateKey);
        $state.go('ipr_tax', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  vm.setCurrency = (currency) => {
    vm.iprTax.currency_id = currency.id;
  };
}
