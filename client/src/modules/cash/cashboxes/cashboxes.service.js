angular.module('bhima.services')
  .service('CashboxService', CashboxService);

CashboxService.$inject = ['$http', 'util'];

/**
 * Cashbox Service
 *
 * This service communicates with both the backend cashboxes API and the cashbox
 * currency API for manipulating cashboxes.  Cashbox-currency methods are
 * exposed behind the service.currencies.* functions.
 * @param $http
 * @param util
 */
function CashboxService($http, util) {
  const service = this;
  const baseUrl = '/cashboxes/';

  // expose service methods to the client for consumption
  service.read = read;
  service.create = create;
  service.update = update;
  service.delete = del;
  service.readPrivileges = readPrivileges;

  // cashbox-currency methods
  service.currencies = {};
  service.currencies.read = readCurrencies;
  service.currencies.create = createCurrencies;
  service.currencies.update = updateCurrencies;

  // cashbox-user methods
  service.users = {};
  service.users.read = readUsers;

  /**
   *
   * @param id
   * @param params
   */
  function read(id, params) {
    const url = `${baseUrl}${id || ''}`;
    return $http.get(url, { params })
      .then(util.unwrapHttpResponse);
  }

  /**
   *
   * @param box
   */
  function create(box) {
    delete box.currencies;
    delete box.type;
    return $http.post(baseUrl, { cashbox : box })
      .then(util.unwrapHttpResponse);
  }

  // update a cashbox in the database
  /**
   *
   * @param id
   * @param box
   */
  function update(id, box) {

    // remove box props that shouldn't be submitted to the server
    delete box.id;
    delete box.type;
    delete box.currencies;

    return $http.put(baseUrl.concat(id), box)
      .then(util.unwrapHttpResponse);
  }

  // DELETE a cashbox in the database
  /**
   *
   * @param id
   */
  function del(id) {
    return $http.delete(baseUrl.concat(id))
      .then(util.unwrapHttpResponse);
  }

  // Reads the user's privileges to the different cashboxes and also lists those
  // for which the user does not have access rights
  /**
   *
   */
  function readPrivileges() {
    const url = baseUrl.concat('privileges');

    return $http.get(url)
      .then(util.unwrapHttpResponse);
  }

  // this will read either all cashbox currency accounts or a specific
  // cashbox currency account.
  /**
   *
   * @param id
   * @param currencyId
   */
  function readCurrencies(id, currencyId) {
    // note that if the currencyId is not defined this will request all currencies
    const url = `${baseUrl}${id}/currencies/${currencyId || ''}`;

    return $http.get(url)
      .then(util.unwrapHttpResponse);
  }

  /**
   *
   * @param id
   * @param data
   */
  function createCurrencies(id, data) {
    const url = `${baseUrl}${id}/currencies`;
    return $http.post(url, data)
      .then(util.unwrapHttpResponse);
  }

  /**
   *
   * @param cashboxId
   * @param data
   */
  function updateCurrencies(cashboxId, data) {
    const currencyId = data.currency_id;
    const url = `${baseUrl}${cashboxId}/currencies/${currencyId}`;

    // delete potentially duplicate data entries
    delete data.currency_id;
    delete data.id;

    return $http.put(url, data)
      .then(util.unwrapHttpResponse);
  }

  /**
   *
   * @param cashboxId
   */
  function readUsers(cashboxId) {
    const url = `${baseUrl}${cashboxId}/users`;
    return $http.get(url)
      .then(util.unwrapHttpResponse);
  }

  return service;
}
