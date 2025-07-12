angular.module('bhima.controllers')
  .controller('WarnExchangeMissingRateModalController', WarnExchangeMissingRateModalController);

WarnExchangeMissingRateModalController.$inject = [
  '$uibModalInstance', '$state', 'missing',
];

/**
 * This modal presents a blocking message to the user urging them to
 * add an exchange rate to a new currency that does not have one.
 */
function WarnExchangeMissingRateModalController(ModalInstance, $state, missing) {
  const vm = this;
  vm.missing = missing;
  vm.cancel = () => ModalInstance.dismiss();
}
