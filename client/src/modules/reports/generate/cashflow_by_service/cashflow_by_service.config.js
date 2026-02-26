angular.module('bhima.controllers')
  .controller('cashflow_by_serviceController', cashflowByServiceController);

cashflowByServiceController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache', 'reportData', '$state',
];

/**
 *
 * @param $sce
 * @param Notify
 * @param SavedReports
 * @param AppCache
 * @param reportData
 * @param $state
 */
function cashflowByServiceController($sce, Notify, SavedReports, AppCache, reportData, $state) {
  const vm = this;
  const cache = new AppCache('configure_cashflow_by_service');
  const reportUrl = 'reports/finance/cashflow/services';

  vm.previewGenerated = false;
  vm.reportDetails = {};
  vm.checked = 0;

  checkCachedConfiguration();

  vm.onSelectCashbox = (cashbox) => {
    vm.reportDetails.cashboxId = cashbox.id;
  };

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

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

  vm.preview = function preview(form) {
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.RECORD_ERROR');
      return 0;
    }

    // update cached configuration
    cache.reportDetails = angular.copy(vm.reportDetails);

    return SavedReports.requestPreview(reportUrl, reportData.id, angular.copy(vm.reportDetails))
      .then(result => {
        vm.previewGenerated = true;
        vm.previewResult = $sce.trustAsHtml(result);
      })
      .catch(Notify.handleError);
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
