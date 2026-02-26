angular.module('bhima.services')
  .service('DebtorService', DebtorService);

DebtorService.$inject = ['$q', '$http', 'util'];

/**
 * Debtor Service
 *
 * This service is responsible for providing an interface between angular
 * module controllers and the server /debtors API endpoint. It also provides
 * a number of utility methods for correctly packaging requests.
 * @param $q
 * @param $http
 * @param util
 * @example
 * Controller.$inject = ['DebtorService'];
 *
 * const Debtors = DebtorService;
 *
 * // Returns all debtor groups
 * Debtors.groups()
 * @module services/DebtorService
 */
function DebtorService($q, $http, util) {
  const service = this;

  /** returns a list of debtors */
  service.read = read;

  /** update the details of a debtor */
  service.update = update;

  /** returns a list of debtor groups */
  service.groups = groups;

  /** returns a list of invoices owed to a given debtor */
  service.invoices = invoices;

  /**
   *
   * @param uuid
   * @param params
   */
  function read(uuid, params = {}) {
    const path = `/debtors/${uuid || ''}`;
    return $http.get(path, { params })
      .then(util.unwrapHttpResponse);
  }

  /**
   *
   */
  function groups() {
    const path = '/debtors/groups';
    return $http.get(path)
      .then(util.unwrapHttpResponse);
  }

  /**
   *
   * @param uuid
   * @param params
   */
  function update(uuid, params) {
    const path = `/debtors/${uuid}`;
    return $http.put(path, params)
      .then(util.unwrapHttpResponse);
  }

  /**
   *
   * @param uuid
   * @param params
   */
  function invoices(uuid, params) {
    const path = `/debtors/${uuid}/invoices`;
    return $http.get(path, { params })
      .then(util.unwrapHttpResponse);
  }
}
