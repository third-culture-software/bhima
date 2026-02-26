angular.module('bhima.services')
  .service('OpenDebtorsReportService', OpenDebtorsReportService);

OpenDebtorsReportService.$inject = ['$translate'];

/**
 * @param $translate
 * @class OpenDebtorsReportService
 * @description
 * An object that contains keys/properties relevant to rendering the Open
 * Debtors Report.
 */
function OpenDebtorsReportService($translate) {
  const service = this;

  const ASC = 1;
  const DESC = 0;

  service.ASC = ASC;
  service.DESC = DESC;

  service.orders = [{
    label : 'REPORT.ORDER.LAST_TRANSACTION',
    value : 'transaction-date-asc',
    direction : ASC,
  }, {
    label : 'REPORT.ORDER.LAST_TRANSACTION',
    value : 'transaction-date-desc',
    direction : DESC,
  }, {
    label : 'REPORT.ORDER.PATIENT_NAME',
    value : 'patient-name-asc',
    direction : ASC,
  }, {
    label : 'REPORT.ORDER.PATIENT_NAME',
    value : 'patient-name-desc',
    direction : DESC,
  }, {
    label : 'REPORT.ORDER.TOTAL_DEBT',
    value : 'debt-asc',
    direction : ASC,
  }, {
    label : 'REPORT.ORDER.TOTAL_DEBT',
    value : 'debt-desc',
    direction : DESC,
  }];

  // ensure a human readable label
  service.orders.forEach((order) => {
    order.hrLabel = $translate.instant(order.label);
  });

  return service;
}
