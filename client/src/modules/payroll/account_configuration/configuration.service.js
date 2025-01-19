angular.module('bhima.services')
  .service('ConfigurationAccountService', ConfigurationAccountService);

ConfigurationAccountService.$inject = ['PrototypeApiService'];

/**
 * @class ConfigurationAccountService
 * @extends PrototypeApiService
 *
 * @description
 * Encapsulates common requests to the /payroll/account_config/ URL.
 */
function ConfigurationAccountService(Api) {
  return new Api('/payroll/account_config/');
}
