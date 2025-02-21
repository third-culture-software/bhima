angular.module('bhima.services')
  .service('ConfigurationService', ConfigurationService);

ConfigurationService.$inject = ['PrototypeApiService'];

/**
 * @class ConfigurationService
 * @extends PrototypeApiService
 *
 * @description
 * Encapsulates common requests to the /payroll/rubric_config/ URL.
 * TODO(@jniles): rename this service
 */
function ConfigurationService(Api) {
  return new Api('/payroll/rubric_config/');
}
