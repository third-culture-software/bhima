angular.module('bhima.controllers')
  .controller('system_usage_statController', systemUsageStatController);

systemUsageStatController.$inject = [
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
function systemUsageStatController($sce, Notify, SavedReports, AppCache, reportData, $state) {
  const vm = this;
  const cache = new AppCache('system_usage_stat');
  const reportUrl = 'reports/finance/system_usage_stat';

  vm.previewGenerated = false;
  vm.reportDetails = {};
  vm.today = new Date();

  vm.clearPreview = () => {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  vm.onDateChange = (date) => {
    // NOTE(@jniles) - set the timezone offsets correctly so that
    // report behaves the same in all localities.
    // Should we do this for all dates?
    date.setHours(vm.today.getHours());
    date.setMinutes(vm.today.getMinutes());
    date.setMilliseconds(vm.today.getMilliseconds());

    vm.reportDetails.date = date;
  };

  vm.preview = (form) => {
    if (form.$invalid || !vm.reportDetails.date) {
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

  vm.requestSaveAs = () => {
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
