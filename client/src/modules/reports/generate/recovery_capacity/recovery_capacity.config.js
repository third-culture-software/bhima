angular.module('bhima.controllers')
  .controller('recovery_capacityController', recoveryCapacityController);

recoveryCapacityController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService',
  'AppCache', 'reportData', '$state', 'SessionService',
];

/**
 *
 * @param $sce
 * @param Notify
 * @param SavedReports
 * @param AppCache
 * @param reportData
 * @param $state
 * @param Session
 */
function recoveryCapacityController($sce, Notify, SavedReports, AppCache, reportData, $state, Session) {
  const vm = this;
  const cache = new AppCache('recovery_capacity');
  const reportUrl = 'reports/finance/recovery_capacity';

  vm.previewGenerated = false;
  vm.reportDetails = { includeUnpostedValues : 0, currencyId : Session.enterprise.currency_id };

  vm.onChangeUnpostedValues = value => {
    vm.reportDetails.includeUnpostedValues = value;
  };

  vm.onSelectCurrency = currency => {
    vm.reportDetails.currencyId = currency.id;
  };

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
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
