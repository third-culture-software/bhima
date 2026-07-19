angular.module('bhima.services')
  .service('CronService', CronService);

CronService.$inject = ['PrototypeApiService'];

/**
 *
 * @param Api
 */
function CronService(Api) {
  return new Api('/crons/');
}
