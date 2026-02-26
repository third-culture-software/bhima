angular.module('bhima.services')
  .service('AssetsScanService', AssetsScanService);

AssetsScanService.$inject = [
  '$http', 'util',
];

/**
 * This service encapsulate some common method of stock lots registry with the aims
 * of reducing lines in registry.js
 * @param $http
 * @param util
 */
function AssetsScanService($http, util) {
  const service = this;

  /**
   * @param params
   * @function list()
   * @returns list of asset scans
   */
  service.list = (params) => {
    return $http.get('/asset/scans', { params })
      .then(util.unwrapHttpResponse);
  };

  /**
   * @description Get the details of a specific asset scan
   * @param {string} uuid
   * @returns {object} scan details
   */
  service.details = uuid => {
    return $http.get(`/asset/scan/${uuid}`)
      .then(util.unwrapHttpResponse);
  };

  /**
   * @description Create a new scan
   * @param {object} params
   * @returns {string} UUID of newly created asset scan
   */
  service.create = params => {
    return $http.post(`/asset/scan`, params)
      .then(util.unwrapHttpResponse);
  };

  /**
   * @description Update a specific asset scan
   * @param {string} uuid of asset scan to change
   * @param {object} params items to change
   * @returns
   */
  service.update = (uuid, params) => {
    return $http.put(`/asset/scan/${uuid}`, params)
      .then(util.unwrapHttpResponse);
  };

  /**
   * @description Delete a specific asset scan
   * @param {string} uuid
   * @returns result of operation
   */
  service.delete = uuid => {
    return $http.delete(`/asset/scan/${uuid}`)
      .then(util.unwrapHttpResponse);
  };

  /**
   * @description Get the last scan for an asset
   * @param {string} asset_uuid
   * @param assetUuid
   * @returns {object} the last asset scan (or null)
   */
  service.getLastScan = assetUuid => {
    return $http.get(`/asset/last_scan/${assetUuid}`)
      .then(util.unwrapHttpResponse);
  };

}
