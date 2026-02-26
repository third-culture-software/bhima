angular.module('bhima.controllers')
  .controller('client_supportController', clientSupportController);

clientSupportController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService',
  'AppCache', 'reportData', '$state',
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
function clientSupportController($sce, Notify, SavedReports, AppCache, reportData, $state) {
  const vm = this;
  const cache = new AppCache('client_support');
  const reportUrl = 'reports/finance/client_support';

  vm.previewGenerated = false;
  vm.reportDetails = {};

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  vm.onChangeShowEmployeeSupport = value => {
    vm.reportDetails.shouldShowEmployeeSupport = value;
  };

  vm.onChangeShowOtherSupport = value => {
    vm.reportDetails.shouldShowOtherSupport = value;
  };

  vm.onChangeShowDetails = value => {
    vm.reportDetails.shouldShowDetails = value;
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

  checkCachedConfiguration();

  /**
   *
   */
  function checkCachedConfiguration() {
    if (cache.reportDetails) {
      vm.reportDetails = angular.copy(cache.reportDetails);
    }
  }
}
