angular.module('bhima.services')
  .service('HelpdeskService', HelpdeskService);

HelpdeskService.$inject = ['PrototypeApiService'];

/**
 * @param Api
 * @function HelpdeskService
 * @description
 * This service implements basic Read functionality to get the helpdesk info string
 * for the current/default enterprise
 */
function HelpdeskService(Api) {
  const service = new Api('/helpdesk_info');
  return service;
}
