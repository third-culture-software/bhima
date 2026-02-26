angular.module('bhima.controllers')
  .controller('balance_sheet_reportController', BalanceSheetReportConfigController);

BalanceSheetReportConfigController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache',
  'reportData', '$state', 'LanguageService',
];

/**
 *
 * @param $sce
 * @param Notify
 * @param SavedReports
 * @param AppCache
 * @param reportData
 * @param $state
 * @param Languages
 */
function BalanceSheetReportConfigController($sce, Notify, SavedReports, AppCache, reportData, $state, Languages) {
  const vm = this;
  const cache = new AppCache('configure_balance_sheet_report');
  const reportUrl = 'reports/finance/balance_sheet';

  vm.previewGenerated = false;

  // FIXME(@jniles) - why is this needed?
  vm.reportDetails = { date : new Date() };

  checkCachedConfiguration();

  vm.onDateChange = date => {
    vm.reportDetails.date = date;
  };

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  vm.requestSaveAs = function requestSaveAs() {
    const options = {
      url : reportUrl,
      report : reportData,
      lang : Languages.key,
      reportOptions : angular.copy(vm.reportDetails),
    };

    return SavedReports.saveAsModal(options)
      .then(() => {
        $state.go('reportsBase.reportsArchive', { key : options.report.report_key });
      })
      .catch(Notify.handleError);
  };

  vm.preview = function preview(form) {
    if (form.$invalid) { return 0; }

    // update cached configuration
    cache.reportDetails = angular.copy(vm.reportDetails);

    return SavedReports.requestPreview(reportUrl, reportData.id, angular.copy(vm.reportDetails))
      .then((result) => {
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
