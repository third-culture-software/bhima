angular.module('bhima.services')
  .service('PatientGroupService', PatientGroupService);

PatientGroupService.$inject = ['$http', 'util'];

/**
 * Patient Group Service
 *
 * A service wrapper for the /patient_groups HTTP endpoint.
 * @param $http
 * @param util
 */
function PatientGroupService($http, util) {
  const service = this;
  const baseUrl = '/patients/groups/';

  service.read = read;
  service.create = create;
  service.update = update;
  service.delete = remove;

  // return a list of patient group
  /**
   *
   * @param uuid
   * @param options
   */
  function read(uuid, options) {
    const url = baseUrl.concat(uuid || '');
    return $http.get(url, { params : options })
      .then(util.unwrapHttpResponse);
  }

  // create a patient group
  /**
   *
   * @param patientGroup
   */
  function create(patientGroup) {

    // make sure we are not submitting empty strings for price lists!
    if (patientGroup.price_list_uuid === '') {
      delete patientGroup.price_list_uuid;
    }

    return $http.post(baseUrl, patientGroup)
      .then(util.unwrapHttpResponse);
  }

  // update a patient group
  /**
   *
   * @param uuid
   * @param patientGroup
   */
  function update(uuid, patientGroup) {
    delete patientGroup.uuid;

    // make sure we are not submitting empty strings for price lists!
    if (patientGroup.price_list_uuid === '') {
      delete patientGroup.price_list_uuid;
    }

    return $http.put(baseUrl + uuid, patientGroup)
      .then(util.unwrapHttpResponse);
  }

  // delete a patient group
  /**
   *
   * @param uuid
   */
  function remove(uuid) {
    return $http.delete(baseUrl + uuid)
      .then(util.unwrapHttpResponse);
  }

  return service;
}
