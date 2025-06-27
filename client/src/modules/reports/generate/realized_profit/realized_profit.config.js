angular.module('bhima.controllers')
  .controller('realized_profitController', realizedProfitController);

realizedProfitController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService',
  'AppCache', 'reportData', '$state',
];

function realizedProfitController($sce, Notify, SavedReports, AppCache, reportData, $state) {
  const vm = this;
  const cache = new AppCache('realized_profit');
  const reportUrl = 'reports/finance/realized_profit';

  vm.previewGenerated = false;
  vm.reportDetails = {
    shouldShowRemainDetails : 1,
    shouldShowInvoicedDetails : 1,
    shouldShowPaidDetails : 1,
  };

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  vm.onChangeShowRemainDetails = value => {
    vm.reportDetails.shouldShowRemainDetails = value;
  };

  vm.onChangeShowPaidDetails = value => {
    vm.reportDetails.shouldShowPaidDetails = value;
  };

  vm.onChangeShowInvoicedDetails = value => {
    vm.reportDetails.shouldShowInvoicedDetails = value;
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

  function checkCachedConfiguration() {
    if (cache.reportDetails) {
      vm.reportDetails = angular.copy(cache.reportDetails);
    }
  }
}
