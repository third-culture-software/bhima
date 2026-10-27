angular.module('bhima.controllers')
  .controller('stock_entryController', StockEntryConfigController);

StockEntryConfigController.$inject = [
   'NotifyService', 'BaseReportService', 'AppCache', 'reportData', '$state',
  'LanguageService', 'SessionService',
];

/**
 * @param Notify
 * @param SavedReports
 * @param AppCache
 * @param reportData
 * @param $state
 * @param Languages
 * @param Session
 */
function StockEntryConfigController(Notify, SavedReports, AppCache, reportData, $state, Languages, Session) {
  const vm = this;
  const cache = new AppCache('configure_stock_entry_report');
  const reportUrl = 'reports/stock/entry';

  vm.options = [
    { id: 1, label : 'REPORT.STOCK.INCLUDE_PURCHASE_ENTRY', param : 'includePurchaseEntry' },
    { id: 2, label : 'REPORT.STOCK.INCLUDE_INTEGRATION_ENTRY', param : 'includeTransferEntry'},
    { id: 3, label : 'REPORT.STOCK.INCLUDE_DONATION_ENTRY', param : 'includeDonationEntry' },
    { id: 4, label : 'REPORT.STOCK.INCLUDE_TRANSFER_ENTRY', param : 'includeIntegrationEntry' },
  ];

  // id -> query string parameter mapping
  const optionMap = new Map(vm.options.map(({id, param}) => [id, param]));

  vm.reportDetails = {
    checkedOptions : [1],
    currency_id : Session.enterprise.currency_id,
  }

  const checkCachedConfiguration = () => {
    if (cache.reportDetails) { 
      vm.reportDetails = angular.copy(cache.reportDetails);
    }
  }

  vm.onChangeOptions = (data) => {
    vm.reportDetails.checkedOptions = data;
  }

  vm.previewGenerated = false;

  // check cached configuration
  checkCachedConfiguration();

  vm.onSelectDepot = depot => {
    vm.reportDetails.depotUuid = depot.uuid;
  };

  vm.onSelectCurrency = currency => {
    vm.reportDetails.currencyId = currency.id;
  };

  vm.clearPreview = () => {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  vm.preview = form => {
    if (form.$invalid || vm.reportDetails.checkedOptions.length === 0) {
      return 0;
    }

    // clear old values from query string
    vm.options.map(({param}) => delete vm.reportDetails[param]);

    // update cached configuration
    cache.reportDetails = angular.copy(vm.reportDetails);

    // make the options into a query string
    const options = vm.reportDetails.checkedOptions
      .reduce((o, id) => { o[optionMap.get(id)] = 1; return o; }, {});

    angular.extend(vm.reportDetails, { ...options, lang : Languages.key });

    return SavedReports.requestPreview(reportUrl, reportData.id, vm.reportDetails)
      .then((result) => {
        vm.previewGenerated = true;
        vm.previewResult = result;
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
}
