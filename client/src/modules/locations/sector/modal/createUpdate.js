angular.module('bhima.controllers')
  .controller('CreateUpdateSectorController', CreateUpdateSectorController);

CreateUpdateSectorController.$inject = [
  'data', '$state', 'LocationService', 'NotifyService', '$uibModalInstance',
];

 /**
  * @param data - The initial raw data object
  * @param $state - Angular state service
  * @param Location - Custom location/geo service
  * @param Notify - Notification utility
  * @param Instance - UI Bootstrap modal instance
  */
function CreateUpdateSectorController(data, $state, Location, Notify, Instance) {
  const vm = this;

  vm.close = Instance.close;
  vm.submit = submit;
  vm.loadProvinces = loadProvinces;

  vm.sector = angular.copy(data);
  vm.isCreateState = !vm.sector.uuid;
  vm.action = vm.isCreateState ? 'FORM.LABELS.CREATE' : 'FORM.LABELS.UPDATE';

  init();

  /**
   *
   */
  function init() {
    if (!vm.isCreateState) {
      vm.sector.country_uuid = data.countryUuid;
      vm.sector.province_uuid = data.provinceUuid;
    }
    Location.countries({ detailed : 1 }).then((countries) => {
      vm.countries = countries;
      if (!vm.isCreateState) loadProvinces();
    });
  }

  /**
   *
   */
  function loadProvinces() {
    return Location.provinces({ detailed : 1, country : vm.sector.country_uuid }).then((provinces) => {
      vm.provinces = provinces;
    });
  }

  /**
   * Handles the form submission
   * @param {ngForm} form - The angular form object
   */
  function submit(form) {
    if (form.$invalid) { return false; }

    const payload = angular.copy(vm.sector);
    delete payload.country_uuid;

    const operation = vm.isCreateState
      ? Location.create.sector(payload)
      : Location.update.sector(data.uuid, payload);

    return operation
      .then(() => {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
        return Instance.close(true);
      })
      .catch(Notify.handleError);
  }
}
