angular.module('bhima.services')
  .service('ConfigurationWeekendService', ConfigurationWeekendService);

ConfigurationWeekendService.$inject = ['PrototypeApiService'];

/**
 * @param Api
 * @class ConfigurationWeekendService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /weekend_config/ URL.
 */
function ConfigurationWeekendService(Api) {
  const service = new Api('/weekend_config/');

  service.getWeekDays = getWeekDays;
  service.setWeekDays = setWeekDays;

  // loads the configuration's week days
  /**
   *
   * @param id
   */
  function getWeekDays(id) {
    return service.$http.get(`/weekend_config/${id}/days`)
      .then(service.util.unwrapHttpResponse);
  }

  // Sets Payroll Weekdays' Configuration using the public API
  /**
   *
   * @param id
   * @param data
   */
  function setWeekDays(id, data) {
    return service.$http.post(`/weekend_config/${id}/days`, { configuration : data })
      .then(service.util.unwrapHttpResponse);
  }

  return service;
}
