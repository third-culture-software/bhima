angular.module('bhima.controllers')
  .controller('stock_valueController', StockValueConfigController);

StockValueConfigController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService',
  'AppCache', 'reportData', '$state',
  'LanguageService', 'moment', 'SessionService',
];

function StockValueConfigController(
  $sce, Notify, SavedReports,
  AppCache, reportData, $state, Languages, moment, Session,
) {
  const vm = this;
  const cache = new AppCache('configure_stock_value_report');
  const reportUrl = 'reports/stock/value';

  vm.reportDetails = {
    dateTo : new Date(),
    excludeZeroValue : 0,
    currency_id : Session.enterprise.currency_id,
  };

  // Default values
  vm.previewGenerated = false;

  vm.onDateChange = (date) => {
    vm.reportDetails.dateTo = date;
  };

  // check cached configuration
  checkCachedConfiguration();

  vm.onSelectDepot = function onSelectDepot(depot) {
    vm.reportDetails.depot_uuid = depot.uuid;
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
      vm.reportDetails = angular.copy(cache.reportDetails || {});
    }

    // always default to today
    vm.dateTo = new Date();

    // Use the enterprise currency by default.
    if (!angular.isDefined(vm.reportDetails.currency_id)) {
      vm.reportDetails.currency_id = Session.enterprise.currency_id;
    }
  }
}
