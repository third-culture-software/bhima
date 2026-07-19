angular.module('bhima.services')
  .service('PeriodApi', PeriodApi);

PeriodApi.$inject = ['PrototypeApiService'];

/**
 *
 * @param Api
 */
function PeriodApi(Api) {
  return new Api('/periods/');
}
