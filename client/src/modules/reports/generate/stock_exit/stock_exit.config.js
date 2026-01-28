angular.module('bhima.controllers')
  .controller('stock_exitController', StockExitConfigController);

StockExitConfigController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache', 'reportData', '$state',
  'LanguageService', 'SessionService',
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
 * @param Session
 */
function StockExitConfigController($sce, Notify, SavedReports, AppCache, reportData, $state, Languages, Session) {
  const vm = this;
  const cache = new AppCache('configure_stock_exit_report');
  const reportUrl = 'reports/stock/exit';

  // default values
  vm.includePatientExit = 1;
  vm.includeServiceExit = 0;
  vm.includeGroupedServiceExit = 0;
  vm.includeDepotExit = 0;
  vm.includeLossExit = 0;
  vm.previewGenerated = false;
  vm.onExitTypeChange = onExitTypeChange;

  vm.currency_id = Session.enterprise.currency_id;

  // check cached configuration
  checkCachedConfiguration();

  // check checked exit type
  onExitTypeChange();

  vm.onSelectDepot = depot => {
    vm.depot = depot;
  };

  vm.onSelectCurrency = currency => {
    vm.currency_id = currency.id;
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

    if (!vm.hasOneChecked) {
      return 0;
    }

    const params = {
      depotUuid : vm.depot.uuid,
      dateFrom : vm.dateFrom,
      dateTo : vm.dateTo,
      currencyId : vm.currency_id,
      includePatientExit : vm.includePatientExit,
      includeServiceExit : vm.includeServiceExit,
      includeGroupedServiceExit : vm.includeGroupedServiceExit,
      includeDepotExit : vm.includeDepotExit,
      includeLossExit : vm.includeLossExit,
      showDetails : vm.showDetails,
    };

    // update cached configuration
    cache.reportDetails = angular.copy(params);
    angular.extend(vm.reportDetails, params, { lang : Languages.key });

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

  /**
   *
   */
  function onExitTypeChange() {
    // be sure at least one checkbox is checked
    const sum = vm.includePatientExit
      + vm.includeServiceExit
      + vm.includeGroupedServiceExit
      + vm.includeDepotExit
      + vm.includeLossExit;
    vm.hasOneChecked = sum > 0;
  }
}
