angular.module('bhima.controllers')
  .controller('rumer_reportController', rumerReportController);

rumerReportController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache', 'reportData', '$state',
  'LanguageService',
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
function rumerReportController($sce, Notify, SavedReports, AppCache, reportData, $state, Languages) {
  const vm = this;
  const cache = new AppCache('rumer_report');
  const reportUrl = 'reports/stock/rumer_report';

  vm.reportDetails = { };
  vm.previewGenerated = false;

  // check cached configuration
  checkCachedConfiguration();

  vm.onSelectDepot = depot => {
    vm.reportDetails.depotUuid = depot.uuid;
    vm.reportDetails.depot_text = depot.text;
  };

  vm.onSelectFiscalYear = (fiscalYear) => {
    vm.reportDetails.fiscal_id = fiscalYear.id;
    vm.reportDetails.fiscalYearStart = fiscalYear.start_date;
  };

  vm.onSelectPeriod = (period) => {
    vm.reportDetails.period_id = period.id;
    vm.reportDetails.end_date = period.end_date;
    vm.reportDetails.start_date = period.start_date;
    vm.reportDetails.translate_key = period.translate_key;
    vm.reportDetails.year = period.year;
  };

  vm.onDailyBalances = () => {
    vm.reportDetails.condensed_report = false;
  };

  vm.onCondensedReport = () => {
    vm.reportDetails.include_daily_balances = false;
  };

  vm.clear = key => {
    delete vm[key];
  };

  vm.clearPreview = () => {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  vm.preview = form => {
    if (form.$invalid) {
      return 0;
    }

    // update cached configuration
    cache.reportDetails = angular.copy(vm.reportDetails);
    angular.extend(vm.reportDetails, { lang : Languages.key });

    return SavedReports.requestPreview(reportUrl, reportData.id, angular.copy(vm.reportDetails))
      .then((result) => {
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

  /**
   *
   */
  function checkCachedConfiguration() {
    vm.reportDetails = angular.copy(cache.reportDetails || {});
  }

}
