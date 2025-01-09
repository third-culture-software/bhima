angular.module('bhima.services')
  .service('IprTaxService', IprTaxService);

IprTaxService.$inject = ['PrototypeApiService'];

/**
 * @class IprTaxService
 * @extends PrototypeApiService
 *
 * @description
 * Encapsulates common requests to the /iprTax/ URL.
 */
function IprTaxService(Api) {
  return new Api('/iprTax/');
}
