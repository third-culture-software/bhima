angular.module('bhima.services')
  .service('DepotService', DepotService);

DepotService.$inject = ['PrototypeApiService', '$uibModal', 'HttpCacheService'];

/**
 * @param Api
 * @param Modal
 * @param HttpCache
 * @class DepotService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /depots/ URL.
 */
function DepotService(Api, Modal, HttpCache) {
  const baseUrl = '/depots/';
  const service = new Api(baseUrl);

  // debounce the read() call for depots
  service.read = read;

  const callback = (id, options) => Api.read.call(service, id, options);
  const fetcher = HttpCache(callback, 250);

  /**
   * The read() method loads data from the api endpoint. If an id is provided,
   * the $http promise is resolved with a single JSON object, otherwise an array
   * of objects should be expected.
   * @param {string} uuid - the uuid of the depot to fetch (optional).
   * @param {object} options - options to be passed as query strings (optional).
   * @param {boolean} cacheBust - ignore the cache and send the HTTP request directly
   *   to the server.
   * @returns {Promise} promise - resolves to either a JSON (if id provided) or
   *   an array of JSONs.
   */
  function read(uuid, options, cacheBust = false) {
    return fetcher(uuid, options, cacheBust);
  }

  /**
   * @function openSelectionModal
   * @description
   * Opens the selection modal to allow a user to select a depot.
   * @returns Promise - a promise containing the selected depot.
   * @param depot
   * @param isDepotRequired helps to keep the modal displayed as long as no depot was submitted
   * @param allowClearing
   */
  service.openSelectionModal = function openSelectionModal(depot, isDepotRequired = false, allowClearing = false) {
    service.isDepotRequired = isDepotRequired;
    service.allowClearing = allowClearing;
    return Modal.open({
      controller : 'SelectDepotModalController as $ctrl',
      templateUrl : 'modules/stock/depot-selection.modal.html',
      resolve : { depot : () => depot },
    }).result;
  };

  service.searchByName = function searchByName(options = {}) {
    const target = baseUrl.concat('search/name');
    return service.$http.get(target, { params : options })
      .then(service.util.unwrapHttpResponse);
  };

  // management
  /**
   * @param depotUuid
   * @function management
   * @description
   * This function searches for all users configured for the management of depots
   * table.
   */
  service.management = function management(depotUuid) {
    const target = `/depots/${depotUuid}/management`;
    return service.$http.get(target)
      .then(service.util.unwrapHttpResponse);
  };

  // sets Depot's for users Depot Management using the public API
  service.updateUsersManagement = function updateUsersManagement(uuid, data) {
    return service.$http.post(`/users/${uuid}/depotUsersManagment`, { users : data })
      .then(service.util.unwrapHttpResponse);
  };

  // supervision
  /**
   * @param depotUuid
   * @function supervision
   * @description
   * Looks up the quantites in stock for all inventory items for a depot.  This is more
   * efficient than the more general Stock.inventories.* API since it uses the stock_movement_status
   * table.
   */
  service.supervision = function supervision(depotUuid) {
    const target = `/depots/${depotUuid}/supervision`;
    return service.$http.get(target)
      .then(service.util.unwrapHttpResponse);
  };

  // sets Depot's for users Depot Supervision using the public API
  service.updateUsersSupervision = function updateUsersSupervision(uuid, data) {
    return service.$http.post(`/users/${uuid}/depotUsersSupervision`, { users : data })
      .then(service.util.unwrapHttpResponse);
  };

  /**
   * @param depotUuid
   * @param options
   * @param date
   * @function getStockQuantityForDate
   * @description
   * Looks up the quantites in stock for all inventory items for a depot.  This is more
   * efficient than the more general Stock.inventories.* API since it uses the stock_movement_status
   * table.
   */
  service.getStockQuantityForDate = function getStockQuantityForDate(depotUuid, options = {}, date = new Date()) {
    const target = `/depots/${depotUuid}/stock`;
    const params = { ...options, date };
    return service.$http.get(target, { params })
      .then(service.util.unwrapHttpResponse);
  };

  /**
   *
   * @param depotUuid
   * @param date
   */
  function stockOutFetcherCallback(depotUuid, date) {
    const target = `/depots/${depotUuid}/flags/stock_out`;
    return service.$http.get(target, { params : { date } })
      .then(service.util.unwrapHttpResponse);
  }

  const getStockOutFetcher = HttpCache(stockOutFetcherCallback, 3000);

  /**
   * @param depotUuid
   * @param date
   * @function getStockOutsForDate
   * @description
   * Looks for stock outs for a given depot on a given date.  If no date is provided, the
   * current date is used.  This API is more efficient than the Stock.inventories.* API as
   * it uses the stock_movement_status table.
   */
  service.getStockOutsForDate = function getStockOutsForDate(depotUuid, date = new Date()) {
    return getStockOutFetcher(depotUuid, date);
  };

  /**
   *
   * @param depotUuid
   * @param date
   */
  function expiredStockFetcherCallback(depotUuid, date) {
    const target = `/depots/${depotUuid}/flags/expired`;
    return service.$http.get(target, { params : { date } })
      .then(service.util.unwrapHttpResponse);
  }

  const getExpiredStockFetcher = HttpCache(expiredStockFetcherCallback, 3000);

  /**
   * @param depotUuid
   * @param date
   * @function getExpiredStockForDate
   * @description
   * Returns lots that are expired in the depot at a given date.
   */
  service.getExpiredStockForDate = function getExpiredStock(depotUuid, date) {
    return getExpiredStockFetcher(depotUuid, date);
  };

  service.clean = depot => {
    delete depot.country_name;
    delete depot.province_name;
    delete depot.sector_name;
    delete depot.village_name;
    delete depot.location;
    delete depot.users;
    delete depot.parent;
    delete depot.distribution_depots;
  };

  return service;
}
