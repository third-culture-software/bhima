angular.module('bhima.controllers')
  .controller('FundingSourcesModalController', FundingSourcesModalController);

FundingSourcesModalController.$inject = [
  'data', 'FundingSourceService', 'NotifyService',
  '$uibModalInstance', '$rootScope',
];

function FundingSourcesModalController(
  data, FundingSourcesService, Notify, Instance, $rootScope,
) {
  const vm = this;
  vm.close = Instance.close;
  vm.submit = submit;

  vm.data = data ? angular.copy(data) : {};
  vm.isCreation = !vm.data.uuid;
  vm.action = vm.isCreation ? 'FORM.LABELS.CREATE' : 'FORM.LABELS.UPDATE';

  function submit(form) {
    if (form.$invalid) {
      return false;
    }

    const operation = vm.isCreation
      ? FundingSourcesService.create(vm.data)
      : FundingSourcesService.update(data.uuid, vm.data);

    return operation
      .then(() => {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
        $rootScope.$broadcast('FUNDING_SOURCES_CHANGED', true);
        vm.close();
      })
      .catch(Notify.handleError);

  }
}
