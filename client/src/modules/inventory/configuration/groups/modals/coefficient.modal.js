angular.module('bhima.controllers')
  .controller('CoefficientActionsModalController', CoefficientActionsModalController);
CoefficientActionsModalController.$inject = [
  'InventoryGroupService', 'NotifyService', '$uibModalInstance',
];

function CoefficientActionsModalController(InventoryGroups, Notify, Instance) {
  const vm = this;

  vm.submit = submit;
  vm.session = {};
  vm.cancel = cancel;

  /* cancel action */
  function cancel() {
    Instance.dismiss();
  }

  function submit(form) {
    if (form.$invalid) { return 0; }

    return InventoryGroups.coefficientSetting(vm.session)
      .then(() => {
        Instance.close();
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
      })
      .catch(Notify.handleError);
  }
}
