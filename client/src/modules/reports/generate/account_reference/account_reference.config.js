angular.module('bhima.controllers')
  .controller('account_referenceController', AccountReferenceReportConfigController);

AccountReferenceReportConfigController.$inject = [
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
function AccountReferenceReportConfigController($sce, Notify, SavedReports, AppCache, reportData, $state) {
  const vm = this;
  const cache = new AppCache('AccountReferenceReport');
  const reportUrl = 'reports/finance/account_reference';

  vm.previewGenerated = false;
  vm.reportDetails = {};

  vm.onSelectFiscalYear = (fiscalYear) => {
    vm.reportDetails.fiscal_id = fiscalYear.id;
  };

  vm.onSelectPeriod = (period) => {
    vm.reportDetails.period_id = period.id;
  };

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  vm.onSelectAccountReferenceType = (referenceType) => {
    vm.reportDetails.reference_type_id = referenceType.id;
    vm.reportDetails.reference_type_label = referenceType.label;
  };

  vm.clear = (value) => {
    delete vm.reportDetails[value];
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
