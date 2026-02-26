angular.module('bhima.services')
  .service('PeriodApi', PeriodApi);

PeriodApi.$inject = ['PrototypeApiService'];

/**
 *
 * @param Api
 */
function PeriodApi(Api) {
  const service = new Api('/periods/');
  return service;
}
