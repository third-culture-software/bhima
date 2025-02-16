angular.module('bhima.controllers')
  .controller('stock_reportController', StockReportConfigController);

StockReportConfigController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService',
  'AppCache', 'reportData', '$state',
  'LanguageService', 'moment', 'SessionService',
];

function StockReportConfigController(
  $sce, Notify, SavedReports,
  AppCache, reportData, $state, Languages, moment, Session,
) {

  const vm = this;
  const cache = new AppCache('configure_stock_report');
  const reportUrl = 'reports/stock/stock_report';

  vm.reportDetails = {
    dateTo : new Date(),
    excludeZeroValue : 0,
    currency_id : Session.enterprise.currency_id,
  };

  // Default values
  vm.previewGenerated = false;

  // check cached configuration
  checkCachedConfiguration();

  vm.onSelectDepot = function onSelectDepot(depot) {
    vm.reportDetails.depot_uuid = depot.uuid;
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

  vm.onSelectFundingSource = (fundingSource) => {
    vm.reportDetails.funding_source_uuid = fundingSource.uuid;
  };

  vm.onSelectCronReport = report => {
    vm.reportDetails = angular.copy(report);
  };

  vm.clear = function clear(key) {
    delete vm.reportDetails[key];
  };

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  vm.onSelectCurrency = (currency) => {
    vm.reportDetails.currency_id = currency.id;
  };

  vm.preview = function preview(form) {
    if (form.$invalid) { return 0; }

    const dateTo = moment(vm.reportDetails.dateTo).format('YYYY-MM-DD');

    const options = {
      ...vm.reportDetails,
      lang : Languages.key,
      dateTo,
    };

    cache.reportDetails = angular.copy(vm.reportDetails);

    return SavedReports.requestPreview(reportUrl, reportData.id, angular.copy(options))
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

  function checkCachedConfiguration() {
    if (cache.reportDetails) {
      vm.reportDetails = angular.copy(cache.reportDetails);
      vm.dateTo = new Date(); // always default to today
    }
  }
}
