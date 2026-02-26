angular.module('bhima.services')
  .service('DashboardService', DashboardService);

DashboardService.$inject = ['$http', 'util'];

/**
 *
 * @param $http
 * @param util
 */
function DashboardService($http, util) {
  const service = this;

  service.debtors = debtors;
  service.invoices = invoices;
  service.patients = patients;

  /**
   *
   */
  function debtors() {
    const url = '/dashboard/debtors';
    return $http.get(url)
      .then(util.unwrapHttpResponse);
  }

  // invoices stats
  /**
   *
   * @param params
   */
  function invoices(params) {
    const url = '/invoices/stats';
    return $http.get(url, { params })
      .then(util.unwrapHttpResponse);
  }

  // patients stats
  /**
   *
   * @param params
   */
  function patients(params) {
    const url = '/patients/stats';
    return $http.get(url, { params })
      .then(util.unwrapHttpResponse);
  }
}
