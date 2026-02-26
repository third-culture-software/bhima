angular.module('bhima.services')
  .service('WardService', WardService);

WardService.$inject = ['PrototypeApiService'];

/**
 * @param Api
 * @class WardService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /wards/ URL.
 */
function WardService(Api) {
  const service = new Api('/wards/');

  return service;
}
