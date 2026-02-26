angular.module('bhima.services')
  .factory('StockDashboardService', StockDashboardService);

StockDashboardService.$inject = ['$http', 'util'];

/**
 *
 * @param $http
 * @param util
 */
function StockDashboardService($http, util) {
  const service = {};
  const baseUrl = '/stock/dashboard';

  service.read = read;

  /**
   *
   * @param options
   */
  function read(options) {
    return $http.get(baseUrl, { params : options })
      .then(util.unwrapHttpResponse);
  }

  return service;
}
