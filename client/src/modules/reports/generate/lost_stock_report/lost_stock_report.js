angular.module('bhima.controllers')
  .controller('lost_stock_reportController', LostStockConfigController);

LostStockConfigController.$inject = [
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
function LostStockConfigController($sce, Notify, SavedReports, AppCache, reportData, $state, Languages, Session) {
  const vm = this;
  const cache = new AppCache('configure_lost_stock_report');
  const reportUrl = 'reports/stock/lost';

  vm.reportDetails = {};

  vm.previewGenerated = false;

  vm.reportDetails.currencyId = Session.enterprise.currency_id;

  // check cached configuration
  checkCachedConfiguration();

  vm.onSelectDepot = depot => {
    vm.reportDetails.depot_uuid = depot.uuid;
  };

  vm.onSelectDepotMode = role => {
    vm.reportDetails.depotRole = role;
  };

  vm.onSelectCurrency = currency => {
    vm.reportDetails.currencyId = currency.id;
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

    // Set the defaults
    if (!angular.isDefined(vm.reportDetails.currencyId)) {
      vm.reportDetails.currencyId = Session.enterprise.currency_id;
    }
    if (!angular.isDefined(vm.reportDetails.depotRole)) {
      vm.reportDetails.depotRole = 'destination';
    }
  }

}
