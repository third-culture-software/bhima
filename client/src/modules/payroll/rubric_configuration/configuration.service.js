angular.module('bhima.services')
  .service('ConfigurationService', ConfigurationService);

ConfigurationService.$inject = ['PrototypeApiService', '$http', 'util'];

/**
 * @class ConfigurationService
 * @extends PrototypeApiService
 *
 * @description
 * Encapsulates common requests to the /rubric_config/ URL.
 */
function ConfigurationService(Api, $http, util) {
  const service = new Api('/rubric_config/');

  service.getRubrics = getRubrics;
  service.setRubrics = setRubrics;

  // loads the configuration's rubrics
  function getRubrics(id) {
    if (angular.isUndefined(id)) {
      throw new Error(
        'Trying to get configuration of rubrics without the identity property',
      );
    }

    return $http.get(`/rubric_config/${id}/setting`)
      .then(util.unwrapHttpResponse);
  }

  // Sets Payroll Rubric's Configuration using the public API
  function setRubrics(id, data) {
    return $http.post(`/rubric_config/${id}/setting`, { configuration : data })
      .then(util.unwrapHttpResponse);
  }

  return service;
}
