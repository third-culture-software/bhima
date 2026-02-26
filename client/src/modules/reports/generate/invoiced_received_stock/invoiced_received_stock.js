angular.module('bhima.controllers')
  .controller('invoiced_received_stockController', invoicedeceivedStockController);

invoicedeceivedStockController.$inject = [
  '$state', '$sce', 'NotifyService', 'AppCache',
  'BaseReportService', 'reportData',
];

/**
 * @param $state
 * @param $sce
 * @param Notify
 * @param AppCache
 * @param SavedReports
 * @param reportData
 * @function invoicedeceivedStockController
 * @description
 */
function invoicedeceivedStockController($state, $sce, Notify, AppCache, SavedReports, reportData) {

  const vm = this;
  const cache = new AppCache('configure_invoiced_received_stock');
  const reportUrl = 'reports/finance/invoiced_received_stock';

  vm.reportDetails = { };

  checkCachedConfiguration();

  vm.requestSaveAs = function requestSaveAs() {
    const options = {
      url : reportUrl,
      report : reportData,
      reportOptions : angular.copy(vm.reportDetails),
    };

    return SavedReports.saveAsModal(options)
      .then(() => {
        $state.go('reportsBase.reportsArchive', { key : options.report.report_key });
      })
      .catch(Notify.handleError);
  };

  // set patient
  vm.setPatient = function setPatient(patient) {
    vm.reportDetails.patientUuid = patient.uuid;
  };

  vm.preview = function preview(form) {
    if (form.$invalid) { return 0; }

    // update cached configuration
    cache.reportDetails = angular.copy(vm.reportDetails);

    return SavedReports.requestPreview(reportUrl, reportData.id, angular.copy(vm.reportDetails))
      .then(result => {
        vm.previewGenerated = true;
        vm.previewResult = $sce.trustAsHtml(result);
      })
      .catch(Notify.handleError);
  };

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  /**
   *
   */
  function checkCachedConfiguration() {
    if (cache.reportDetails) {
      vm.reportDetails = angular.copy(cache.reportDetails);
    }
  }
}
