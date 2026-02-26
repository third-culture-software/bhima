angular.module('bhima.services')
  .service('DocumentService', DocumentService);

DocumentService.$inject = ['$http', 'util'];

/**
 *
 * @param $http
 * @param util
 */
function DocumentService($http, util) {
  const service = this;
  const baseUrl = '/patients/';

  // expose the service
  service.read = read;
  service.remove = remove;
  service.removeAll = removeAll;

  /**
   * This method returns documents on a patient given the patients UUID.
   * @param {string | null} uuid   The patient's UUID  (could be null)
   * @param patientUuid
   * @returns {object}       Promise object that will return patient details
   */
  function read(patientUuid) {
    if (!patientUuid) { return 0; }

    return $http.get(baseUrl.concat(patientUuid, '/documents'))
      .then(util.unwrapHttpResponse);
  }

  /**
   * delete document
   * @param patientUuid
   * @param documentUuid
   */
  function remove(patientUuid, documentUuid) {
    return $http.delete(baseUrl.concat(patientUuid, '/documents/', documentUuid))
      .then(util.unwrapHttpResponse);
  }

  /**
   * delete all document
   * @param patientUuid
   */
  function removeAll(patientUuid) {
    return $http.delete(baseUrl.concat(patientUuid, '/documents'))
      .then(util.unwrapHttpResponse);
  }

}
