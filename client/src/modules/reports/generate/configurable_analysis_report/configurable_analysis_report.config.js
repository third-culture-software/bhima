angular.module('bhima.controllers')
  .controller('configurable_analysis_reportController', ConfigurableAnalysisReportController);

ConfigurableAnalysisReportController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache', 'reportData', '$state', 'ConfigurationAnalysisToolsService',
];

/**
 *
 * @param $sce
 * @param Notify
 * @param SavedReports
 * @param AppCache
 * @param reportData
 * @param $state
 * @param ConfigurationAnalysisTools
 */
function ConfigurableAnalysisReportController($sce, Notify, SavedReports, AppCache,
  reportData, $state, ConfigurationAnalysisTools) {
  const vm = this;
  const cache = new AppCache('configurable_analysis_report');
  const reportUrl = 'reports/finance/configurable_analysis_report';

  ConfigurationAnalysisTools.read()
    .then((configurationAnalysisTools) => {
      vm.configurationsAreMissing = (configurationAnalysisTools.length === 0);
    })
    .catch(handleError);

  vm.reportDetails = {
    includeUnpostedValues : 0,
  };

  /**
   *
   * @param error
   */
  function handleError(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  vm.previewGenerated = false;

  checkCachedConfiguration();

  vm.onSelectFiscal = function onSelectFiscal(fiscal) {
    vm.reportDetails.fiscalYearId = fiscal;
  };

  vm.onSelectPeriodFrom = function onSelectPeriodFrom(period) {
    vm.reportDetails.periodFrom = period.id;
    vm.reportDetails.start_date = period.start_date;
    vm.reportDetails.start_label = period.translate_key;
    vm.reportDetails.start_year = period.year;
  };

  vm.onSelectPeriodTo = function onSelectPeriodTo(period) {
    vm.reportDetails.periodTo = period.id;
    vm.reportDetails.end_date = period.end_date;
    vm.reportDetails.end_label = period.translate_key;
    vm.reportDetails.end_year = period.year;
  };

  vm.onSelectCashboxes = (cashboxesIds) => {
    vm.reportDetails.cashboxesIds = cashboxesIds;
  };

  vm.onChangeUnpostedValues = (bool) => {
    vm.reportDetails.includeUnpostedValues = bool;
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

  // load cache if defined
  /**
   *
   */
  function checkCachedConfiguration() {
    if (cache.reportDetails) {
      vm.reportDetails = angular.copy(cache.reportDetails);
    }
  }
}
