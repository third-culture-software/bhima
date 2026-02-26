angular.module('bhima.controllers')
  .controller('ServiceModalController', ServiceModalController);

ServiceModalController.$inject = [
  '$state', 'ServiceService', 'NotifyService', 'params',
];

/**
 *
 * @param $state
 * @param Services
 * @param Notify
 * @param params
 */
function ServiceModalController(
  $state, Services, Notify, params,
) {
  const vm = this;

  vm.service = { ...params.service };
  vm.isCreateState = !!(params.isCreateState);

  // exposed methods
  vm.submit = submit;
  vm.closeModal = closeModal;

  vm.onCostCenterSelect = cc => {
    vm.service.cost_center_id = cc.id;
    vm.service.cost_center_name = cc.label;
  };

  vm.onSelectProject = project => {
    vm.service.project_id = project.id;
  };

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param serviceForm
   */
  function submit(serviceForm) {
    if (serviceForm.$invalid || serviceForm.$pristine) { return 0; }

    const promise = (vm.isCreateState)
      ? Services.create(vm.service)
      : Services.update(vm.service.uuid, vm.service);

    return promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'SERVICE.CREATED' : 'SERVICE.UPDATED';
        Notify.success(translateKey);
        $state.go('services', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function closeModal() {
    $state.go('services');
  }
}
