angular.module('bhima.controllers')
  .controller('AllocationBasisModalController', AllocationBasisModalController);

AllocationBasisModalController.$inject = [
  'data', 'CostCenterService', 'AllocationBasisService', 'NotifyService', '$uibModalInstance', '$translate',
];

/**
 *
 * @param data
 * @param CostCenter
 * @param AllocationBasisService
 * @param Notify
 * @param Instance
 * @param $translate
 */
function AllocationBasisModalController(data, CostCenter, AllocationBasisService, Notify, Instance, $translate) {
  const vm = this;

  vm.close = Instance.close;
  vm.submit = submit;
  vm.details = {};
  vm.$loading = false;

  vm.isCreation = !angular.isNumber(data.id);

  vm.action = vm.isCreation ? 'FORM.LABELS.CREATE' : 'FORM.LABELS.UPDATE';

  /**
   *
   */
  function loadData() {
    vm.$loading = true;
    AllocationBasisService.read(data.id)
      .then(details => {
        if (details.is_predefined) {
          details.name = $translate.instant(details.name);
          details.description = $translate.instant(details.description);
        }
        vm.details = details;
      })
      .finally(() => {
        vm.$loading = false;
      });
  }

  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) {
      return false;
    }
    const basis = {
      name : vm.details.name,
      units : vm.details.units,
      description : vm.details.description,
    };
    if (vm.isCreation) {
      basis.is_predefined = false;
    }

    const operation = vm.isCreation
      ? AllocationBasisService.create(basis)
      : AllocationBasisService.update(vm.details.id, basis);

    return operation
      .then(() => {
        // ?? Notify.success('FORM.INFO.OPERATION_SUCCESS');
        vm.close();
      })
      .catch(Notify.handleError);
  }

  if (!vm.isCreation) {
    loadData();
  }

}
