angular.module('bhima.services')
  .service('SupplierService', SupplierService);

SupplierService.$inject = ['PrototypeApiService'];

/**
 *
 * @param Api
 */
function SupplierService(Api) {
  const service = new Api('/suppliers/');
  return service;
}
