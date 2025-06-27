angular.module('bhima.controllers')
  .controller('AlertModalController', AlertModalController);

AlertModalController.$inject = ['$uibModalInstance', 'prompt'];

/**
 * Alert Modal Controller
 *
 * This controller provides bindings for the alert modal.
 */
function AlertModalController(Instance, prompt) {
  const vm = this;

  vm.dismiss = Instance.dismiss;

  /**
   * bind the prompt to the view, if provided
   * @todo - should this be done automatically with controllerAs?
   */
  vm.prompt = prompt;

  // bind modal controls
  vm.close = Instance.close;
}
