angular.module('bhima.services')
  .factory('StockSettingsService', StockSettingsService);

StockSettingsService.$inject = ['$http', 'util'];

/**
 *
 * @param $http
 * @param util
 */
function StockSettingsService($http, util) {
  const service = {};
  const baseUrl = '/stock/setting/';

  service.read = read;
  service.create = create;
  service.update = update;

  /**
   *
   * @param id
   * @param options
   */
  function read(id, options) {
    const url = baseUrl.concat(id || '');
    return $http.get(url, { params : options })
      .then(util.unwrapHttpResponse);
  }

  /**
   *
   * @param enterpriseId
   */
  function create(enterpriseId) {
    return $http.post(baseUrl, { enterprise_id : enterpriseId })
      .then(util.unwrapHttpResponse);
  }

  /**
   *
   * @param id
   * @param settings
   */
  function update(id, settings) {
    return $http.put(baseUrl.concat(id), settings)
      .then(util.unwrapHttpResponse);
  }

  return service;
}
