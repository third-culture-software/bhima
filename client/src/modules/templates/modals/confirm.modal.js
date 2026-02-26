angular.module('bhima.controllers')
  .controller('ConfirmModalController', ConfirmModalController);

ConfirmModalController.$inject = ['$uibModalInstance', 'prompt'];

/**
 * @param Instance
 * @param prompt
 * @class ConfirmModalController
 * @description
 * This controller provides bindings for a modal that confirms if
 * the user should be able to perform an action or not.
 */
function ConfirmModalController(Instance, prompt) {
  const vm = this;

  vm.dismiss = function dismis() { return Instance.dismiss(false); };
  vm.submit = function submit() { return Instance.close(true); };
  vm.prompt = (prompt || 'FORM.DIALOGS.CONFIRM_DELETE');
}
