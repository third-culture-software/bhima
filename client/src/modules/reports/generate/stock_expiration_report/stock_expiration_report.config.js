angular.module('bhima.controllers')
  .controller('stock_expiration_reportController', StockExpirationReportConfigCtrl);

StockExpirationReportConfigCtrl.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache', 'reportData', '$state',
  'LanguageService', 'SessionService',
];

function StockExpirationReportConfigCtrl($sce, Notify, SavedReports, AppCache, reportData, $state, Languages, Session) {
  const vm = this;
  const cache = new AppCache('stock_expiration_report');
  const reportUrl = 'reports/stock/expiration_report';

  // default values
  vm.reportDetails = { };
  vm.previewGenerated = false;

  // check cached configuration
  checkCachedConfiguration();

  vm.onSelectDepot = depot => {
    vm.reportDetails.depot_uuid = depot.uuid;
  };

  vm.onSelectFiscalYear = year => {
    vm.reportDetails.fiscal_id = year.id;
  };

  vm.onSelectCurrency = currency => {
    vm.reportDetails.currencyId = currency.id;
  };

  vm.onSelectPeriod = period => {
    vm.reportDetails.period_id = period.id;
  };

  vm.clear = key => {
    delete vm.reportDetails[key];
  };

  vm.clearPreview = () => {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  function formatData(data) {
    const formatted = angular.copy(data);
    if (!vm.chooseOneDepot) {
      delete formatted.depot_uuid;
    }

    if (!vm.chooseOneInventory) {
      delete formatted.inventory_uuid;
    }
    return formatted;
  }

  vm.preview = form => {
    if (form.$invalid) {
      return 0;
    }

    // Clear previously selected depot UUID if not doing specific depot
    if (!vm.chooseOneDepot) {
      delete vm.reportDetails.depot_uuid;
    }

    // update cached configuration
    cache.reportDetails = formatData(vm.reportDetails);

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

  function checkCachedConfiguration() {
    vm.reportDetails = angular.copy(cache.reportDetails || {});

    // Set the defaults
    if (!angular.isDefined(vm.reportDetails.currencyId)) {
      vm.reportDetails.currencyId = Session.enterprise.currency_id;
    }
  }
}
