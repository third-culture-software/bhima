angular.module('bhima.services')
  .service('RequiredInventoryScansService', RequiredInventoryScansService);

RequiredInventoryScansService.$inject = [
  '$http', 'util',
];

/**
 * This service encapsulate some common database queries for required inventory scans
 * @param $http
 * @param util
 */
function RequiredInventoryScansService($http, util) {
  const service = this;

  /**
   * @param params
   * @function list()
   * @returns list of required inventory scans
   */
  service.list = (params) => {
    return $http.get('/inventory/required/scans', { params })
      .then(util.unwrapHttpResponse);
  };

  /**
   * @description Get the details of a specific required inventory scan
   * @param {string} uuid
   * @returns {object} scan details
   */
  service.details = uuid => {
    return $http.get(`/inventory/required/scan/${uuid}`)
      .then(util.unwrapHttpResponse);
  };

  /**
   * @description Create a new required inventory scan
   * @param {object} params
   * @returns {string} UUID of newly created required inventory scan
   */
  service.create = params => {
    return $http.post(`/inventory/required/scan`, params)
      .then(util.unwrapHttpResponse);
  };

  /**
   * @description Update a specific required inventory scan
   * @param {string} uuid of required inventory scan to change
   * @param {object} params items to change
   * @returns
   */
  service.update = (uuid, params) => {
    return $http.put(`/inventory/required/scan/${uuid}`, params)
      .then(util.unwrapHttpResponse);
  };

  /**
   * @description Delete a specific required inventory scan
   * @param {string} uuid
   * @returns
   */
  service.delete = uuid => {
    return $http.delete(`/inventory/required/scan/${uuid}`)
      .then(util.unwrapHttpResponse);
  };

}
