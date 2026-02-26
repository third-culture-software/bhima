angular.module('bhima.services')
  .service('BedService', BedService);

BedService.$inject = ['PrototypeApiService'];

/**
 * @param Api
 * @class BedService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /beds/ URL.
 */
function BedService(Api) {
  const service = new Api('/beds/');

  return service;
}
