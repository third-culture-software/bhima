angular.module('bhima.controllers')
  .controller('stock_exitController', StockExitConfigController);

StockExitConfigController.$inject = [
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
function StockExitConfigController(Notify, SavedReports, AppCache, reportData, $state, Languages, Session) {
  const vm = this;
  const cache = new AppCache('configure_stock_exit_report');
  const reportUrl = 'reports/stock/exit';

  // default values
  vm.previewGenerated = false;

  vm.options = [
    { id: 1, label : 'REPORT.STOCK.INCLUDE_PATIENT_EXIT', param : 'includePatientExit' },
    { id: 2, label : 'REPORT.STOCK.INCLUDE_SERVICE_EXIT', param : 'includeServiceExit'},
    { id: 3, label : 'REPORT.STOCK.INCLUDE_GROUPED_SERVICE_EXIT', param : 'includeGroupedServiceExit' },
    { id: 4, label : 'REPORT.STOCK.INCLUDE_DEPOT_EXIT', param : 'includeDepotExit' },
    { id: 5, label : 'REPORT.STOCK.INCLUDE_LOSS_EXIT', param : 'includeLossExit' },
  ];

  // id -> query string parameter mapping
  const optionMap = new Map(vm.options.map(({id, param}) => [id, param]));

  // default values
  vm.reportDetails = {
    checkedOptions : [1],
    currency_id : Session.enterprise.currency_id,
  }

  vm.onChangeOptions = (data) => {
    vm.reportDetails.checkedOptions = data;
  }

  const checkCachedConfiguration = () => {
    if (cache.reportDetails) { 
      vm.reportDetails = angular.copy(cache.reportDetails);
    }
  }

  checkCachedConfiguration();

  vm.onSelectDepot = depot => {
    vm.reportDetails.depotUuid = depot.uuid;
  };

  vm.onSelectCurrency = currency => {
    vm.reportDetails.currency_id = currency.id;
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
