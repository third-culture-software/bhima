angular.module('bhima.controllers')
  .controller('satisfaction_rate_reportController', SatisfactionRateReportController);

SatisfactionRateReportController.$inject = [
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
function SatisfactionRateReportController($sce, Notify, SavedReports, AppCache, reportData, $state) {
  const vm = this;
  const cache = new AppCache('satisfaction_rate_report');
  const reportUrl = '/reports/stock/satisfaction_rate_report';
  vm.reportDetails = {};
  vm.previewGenerated = false;
  vm.loading = false;
  checkCachedConfiguration();

  vm.onSelectDepots = (depotUuids) => {
    vm.reportDetails.depotUuids = depotUuids;
  };

  vm.preview = function preview(form) {
    if (form.$invalid) { return; }
    cache.reportDetails = angular.copy(vm.reportDetails);
    vm.loading = true;
    SavedReports.requestPreview(reportUrl, reportData.id, angular.copy(vm.reportDetails))
      .then((result) => {
        vm.previewGenerated = true;
        vm.previewResult = $sce.trustAsHtml(result);
        vm.loading = false;
      })
      .catch(handleError);
  };

  /**
   *
   * @param error
   */
  function handleError(error) {
    Notify.handleError(error);
    vm.loading = false;
  }

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

  /**
   *
   */
  function checkCachedConfiguration() {
    if (cache.reportDetails) {
      vm.reportDetails = angular.copy(cache.reportDetails);
    }
    vm.reportDetails.type = 1;
  }
}
