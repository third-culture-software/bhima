angular.module('bhima.controllers')
  .controller('CreateUpdateProvinceController', CreateUpdateProvinceController);

CreateUpdateProvinceController.$inject = [
  'data', '$state', 'LocationService', 'NotifyService', '$uibModalInstance',
];

/**
 *
 * @param data
 * @param $state
 * @param Location
 * @param Notify
 * @param Instance
 */
function CreateUpdateProvinceController(data, $state, Location, Notify, Instance) {
  const vm = this;
  vm.close = Instance.close;
  vm.submit = submit;

  vm.province = angular.copy(data);
  vm.isCreate = !vm.province.uuid;
  vm.action = vm.isCreate ? 'FORM.LABELS.CREATE' : 'FORM.LABELS.UPDATE';

  init();

  /**
   *
   */
  function init() {
    if (!vm.isCreate) {
      vm.province.country_uuid = data.countryUuid;
    }
    Location.countries({ detailed : 1 }).then((countries) => {
      vm.countries = countries;
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

    const operation = (!data.uuid)
      ? Location.create.province(vm.province)
      : Location.update.province(data.uuid, vm.province);

    return operation
      .then(() => {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
        return Instance.close(true);
      })
      .catch(Notify.handleError);
  }
}
