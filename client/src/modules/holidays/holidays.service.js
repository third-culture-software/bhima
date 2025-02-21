angular.module('bhima.services')
  .service('HolidayService', HolidayService);

HolidayService.$inject = ['PrototypeApiService'];

/**
 * @class HolidayService
 * @extends PrototypeApiService
 *
 * @description
 * Encapsulates common requests to the /holidays/ URL.
 */
function HolidayService(Api) {
  return new Api('/holidays/');
}
