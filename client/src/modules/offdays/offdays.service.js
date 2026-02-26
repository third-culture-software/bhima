angular.module('bhima.services')
  .service('OffdayService', OffdayService);

OffdayService.$inject = ['PrototypeApiService'];

/**
 * @param Api
 * @class OffdayService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /offdays/ URL.
 */
function OffdayService(Api) {
  return new Api('/offdays/');
}
