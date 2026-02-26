angular.module('bhima.services')
  .service('HolidayService', HolidayService);

HolidayService.$inject = ['PrototypeApiService'];

/**
 * @param Api
 * @class HolidayService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /holidays/ URL.
 */
function HolidayService(Api) {
  return new Api('/holidays/');
}
