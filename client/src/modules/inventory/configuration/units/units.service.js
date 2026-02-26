angular.module('bhima.services')
  .service('InventoryUnitService', InventoryUnitService);

/** Dependencies infection */
InventoryUnitService.$inject = ['PrototypeApiService', '$translate'];

/**
 * Inventory Unit Service
 * @param PrototypeApiService
 * @param $translate
 */
function InventoryUnitService(PrototypeApiService, $translate) {
  const service = new PrototypeApiService('/inventory/units/');

  service.getUnits = function getUnits() {
    return service.read()
      .then(units => {
        units.forEach(u => {
          if (u.token) {
            u.predefined = true;
            u.text = $translate.instant(`INVENTORY.UNITS.${u.token}.TEXT`);
            u.abbr = $translate.instant(`INVENTORY.UNITS.${u.token}.ABBR`);
          } else {
            u.predefined = false;
          }
        });
        return units;
      });
  };

  return service;
}
