angular.module('bhima.services')
  .service('FunctionService', FunctionService);

FunctionService.$inject = ['PrototypeApiService'];

/**
 * @class FunctionService
 * @extends PrototypeApiService
 *
 * @description
 * Encapsulates common requests to the /functions/ URL.
 */
function FunctionService(Api) {
  return new Api('/functions/');
}
