angular.module('bhima.services')
  .service('DischargeTypeService', DischargeTypeService);

// dependencies injection
DischargeTypeService.$inject = ['PrototypeApiService'];

// service definition
/**
 *
 * @param Api
 */
function DischargeTypeService(Api) {
  const service = new Api('/discharge_types');

  return service;
}
