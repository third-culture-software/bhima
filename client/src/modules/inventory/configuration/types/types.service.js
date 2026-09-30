angular.module('bhima.services')
  .service('InventoryTypeService', InventoryTypeService);

InventoryTypeService.$inject = ['PrototypeApiService'];

/**
 * Inventory Type Service
 * @param Api
 */
function InventoryTypeService(Api) {
  const service = new Api('/inventory/types/');
  return service;
}
