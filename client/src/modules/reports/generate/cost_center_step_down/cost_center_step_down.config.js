angular.module('bhima.controllers')
  .controller('cost_center_step_downController', CostCenterStepdownReportConfigController);

CostCenterStepdownReportConfigController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache', 'reportData', '$state',
  'SessionService',
];

/**
 * @function CostCenterStepdownReportConfigController
 *
 * @description
 * This function renders the cost_center_step_down report.
 */
function CostCenterStepdownReportConfigController($sce, Notify, SavedReports, AppCache, reportData, $state, Session) {
  const vm = this;
  const cache = new AppCache('CostCenterStepdownReport');
  const reportUrl = 'reports/finance/cost_center_step_down';

  vm.previewGenerated = false;
  vm.reportDetails = {
    include_revenue : false,
    show_allocations_table : true,
  };

  checkCachedConfiguration();

  vm.onSelectFiscalYear = (fiscalYear) => {
    vm.reportDetails.fiscal_id = fiscalYear.id;
  };

  vm.onSelectPeriodFrom = function onSelectPeriodFrom(period) {
    vm.reportDetails.periodFrom = period.id;
  };

  vm.onSelectPeriodTo = function onSelectPeriodTo(period) {
    vm.reportDetails.periodTo = period.id;
  };

  vm.onToggleRevenueCenter = function onToggleRevenueCenter(bool) {
    vm.reportDetails.include_revenue = bool;
  };

  vm.onToggleShowAllocationsTable = function onToggleShowAllocationsTable(bool) {
    vm.reportDetails.show_allocations_table = bool;
  };

  vm.onSelectCurrency = (currency) => {
    vm.reportDetails.currency_id = currency.id;
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

  function checkCachedConfiguration() {
    vm.reportDetails = angular.copy(cache.reportDetails || {});

    // Set the defaults
    if (!angular.isDefined(vm.reportDetails.currency_id)) {
      vm.reportDetails.currency_id = Session.enterprise.currency_id;
    }
  }
}
