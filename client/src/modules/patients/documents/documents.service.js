angular.module('bhima.services')
  .service('DocumentService', DocumentService);

DocumentService.$inject = ['$http', 'util'];

function DocumentService($http, util) {
  const service = this;
  const baseUrl = '/patients/';

  // expose the service
  service.read = read;
  service.remove = remove;
  service.removeAll = removeAll;

  /**
   * This method returns documents on a patient given the patients UUID.
   *
   * @param {String|Null} uuid   The patient's UUID  (could be null)
   * @return {Object}       Promise object that will return patient details
   */
  function read(patientUuid) {
    if (!patientUuid) { return 0; }

    return $http.get(baseUrl.concat(patientUuid, '/documents'))
      .then(util.unwrapHttpResponse);
  }

  /** delete document */
  function remove(patientUuid, documentUuid) {
    return $http.delete(baseUrl.concat(patientUuid, '/documents/', documentUuid))
      .then(util.unwrapHttpResponse);
  }

  /** delete all document */
  function removeAll(patientUuid) {
    return $http.delete(baseUrl.concat(patientUuid, '/documents'))
      .then(util.unwrapHttpResponse);
  }

}
