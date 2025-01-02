angular.module('bhima.services')
  .service('OffdayService', OffdayService);

OffdayService.$inject = ['PrototypeApiService'];

/**
 * @class OffdayService
 * @extends PrototypeApiService
 *
 * @description
 * Encapsulates common requests to the /offdays/ URL.
 */
function OffdayService(Api) {
  return new Api('/offdays/');
}
