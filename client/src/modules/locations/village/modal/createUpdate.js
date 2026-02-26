angular.module('bhima.controllers')
  .controller('CreateUpdateVillageController', CreateUpdateVillageController);

CreateUpdateVillageController.$inject = [
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
function CreateUpdateVillageController(data, $state, Location, Notify, Instance) {
  const vm = this;
  vm.close = Instance.close;
  vm.submit = submit;
  vm.loadProvinces = loadProvinces;
  vm.loadSectors = loadSectors;

  vm.village = angular.copy(data);
  vm.isCreate = !vm.village.uuid;
  vm.action = vm.isCreate ? 'FORM.LABELS.CREATE' : 'FORM.LABELS.UPDATE';

  init();

  /**
   *
   */
  function init() {
    if (!vm.isCreate) {
      vm.village.country_uuid = data.countryUuid;
      vm.village.province_uuid = data.provinceUuid;
      vm.village.sector_uuid = data.sectorUuid;
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
    Location.provinces({ detailed : 1, country : vm.village.country_uuid }).then((provinces) => {
      vm.provinces = provinces;
      if (!vm.isCreate) loadSectors();
    });
  }

  /**
   *
   */
  function loadSectors() {
    Location.sectors({ detailed : 1, province : vm.village.province_uuid }).then((sectors) => {
      vm.sectors = sectors;
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

    const formatedVillage = {
      uuid : vm.village.uuid,
      name :  vm.village.name,
      sector_uuid : vm.village.sector_uuid,
      longitude : vm.village.longitude,
      latitude : vm.village.latitude,
    };

    const operation = (!data.uuid)
      ? Location.create.village(formatedVillage)
      : Location.update.village(data.uuid, formatedVillage);

    return operation
      .then(() => {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
        return Instance.close(true);
      })
      .catch(Notify.handleError);
  }
}
