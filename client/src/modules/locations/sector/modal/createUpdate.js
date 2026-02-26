angular.module('bhima.controllers')
  .controller('CreateUpdateSectorController', CreateUpdateSectorController);

CreateUpdateSectorController.$inject = [
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
function CreateUpdateSectorController(data, $state, Location, Notify, Instance) {
  const vm = this;
  vm.close = Instance.close;
  vm.submit = submit;
  vm.loadProvinces = loadProvinces;

  vm.sector = angular.copy(data);

  vm.isCreate = !vm.sector.uuid;
  vm.action = vm.isCreate ? 'FORM.LABELS.CREATE' : 'FORM.LABELS.UPDATE';

  init();

  /**
   *
   */
  function init() {
    if (!vm.isCreate) {
      vm.sector.country_uuid = data.countryUuid;
      vm.sector.province_uuid = data.provinceUuid;
    }
    Location.countries({ detailed : 1 }).then((countries) => {
      vm.countries = countries;
      if (!vm.isCreate) loadProvinces();
    });
  }

  /**
   *
   */
  function loadProvinces() {
    Location.provinces({ detailed : 1, country : vm.sector.country_uuid }).then((provinces) => {
      vm.provinces = provinces;
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

    const formatedSector = angular.copy(vm.sector);
    delete formatedSector.country_uuid;

    const operation = (!data.uuid)
      ? Location.create.sector(formatedSector)
      : Location.update.sector(data.uuid, formatedSector);

    return operation
      .then(() => {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
        return Instance.close(true);
      })
      .catch(Notify.handleError);
  }
}
