angular.module('bhima.controllers')
  .controller('cost_centerController', CostCenterConfigController);

CostCenterConfigController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache', 'reportData', '$state', 'SessionService',
];

// TODO(@jniles) - this name is remarkably close to the cost center controller.  Let's name
// it something else that is more distant.
function CostCenterConfigController($sce, Notify, SavedReports, AppCache, reportData, $state, Session) {
  const vm = this;
  const cache = new AppCache('configure_cost_center');
  const reportUrl = 'reports/finance/cost_center';

  vm.reportDetails = {};
  vm.previewGenerated = false;
  checkCachedConfiguration();

  vm.currency_id = Session.enterprise.currency_id;

  vm.onSelectFiscalYear = (fiscalYear) => {
    vm.reportDetails.fiscal_id = fiscalYear.id;
    vm.reportDetails.fiscalYearStart = fiscalYear.start_date;
  };

  vm.onSelectPeriod = (period) => {
    vm.reportDetails.period_id = period.id;
    vm.reportDetails.end_date = period.end_date;
    vm.reportDetails.start_date = period.start_date;
  };

  vm.onSelectCurrency = currency => {
    vm.currency_id = currency.id;
  };

  vm.preview = function preview(form) {
    if (form.$invalid) { return null; }
    // update cached configuration
    vm.reportDetails.currency_id = vm.currency_id;
    cache.reportDetails = angular.copy(vm.reportDetails);

    return SavedReports.requestPreview(reportUrl, reportData.id, angular.copy(vm.reportDetails))
      .then((result) => {
        vm.previewGenerated = true;
        vm.previewResult = $sce.trustAsHtml(result);
      })
      .catch(Notify.handleError);
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

  function checkCachedConfiguration() {
    vm.reportDetails = angular.copy(cache.reportDetails || {});

    // TODO(@jniles) - what is this?
    vm.reportDetails.type = 1;
  }
}
