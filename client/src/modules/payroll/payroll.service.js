angular.module('bhima.services')
  .service('PayrollConfigurationService', PayrollConfigurationService);

PayrollConfigurationService.$inject = ['PrototypeApiService'];

/**
 * @param Api
 * @class PayrollConfigurationService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /payroll_config/ URL.
 */
function PayrollConfigurationService(Api) {
  const service = new Api('/payroll_config/');

  service.paymentStatus = paymentStatus;

  /**
   *
   */
  function paymentStatus() {
    const url = ''.concat('paymentStatus');
    return Api.read.call(service, url);
  }

  return service;
}
