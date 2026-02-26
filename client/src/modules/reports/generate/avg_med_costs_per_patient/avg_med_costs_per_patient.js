angular.module('bhima.controllers')
  .controller('avg_med_costs_per_patientController', AvgMedCostPerPatientCtrl);

AvgMedCostPerPatientCtrl.$inject = [
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
function AvgMedCostPerPatientCtrl($sce, Notify, SavedReports, AppCache, reportData, $state, Languages, Session) {
  const vm = this;
  const cache = new AppCache('avg_med_costs_per_patient');
  const reportUrl = 'reports/stock/avg_med_costs_per_patient';

  // default values for the report parameters
  vm.reportDetails = {
  };

  vm.previewGenerated = false;

  // check cached configuration
  checkCachedConfiguration();

  vm.onSelectDepot = depot => {
    vm.reportDetails.depotUuid = depot.uuid;
    vm.reportDetails.depotName = depot.text;
  };

  vm.clearDepot = () => {
    delete vm.reportDetails.depotUuid;
    delete vm.reportDetails.depotName;
  };

  vm.onSelectService = service => {
    vm.reportDetails.serviceUuid = service.uuid;
    vm.reportDetails.serviceName = service.name;
  };

  vm.clearService = () => {
    delete vm.reportDetails.serviceUuid;
    delete vm.reportDetails.serviceName;
  };

  vm.onSelectCurrency = currency => {
    vm.reportDetails.currencyId = currency.id;
  };

  vm.clear = key => {
    delete vm.reportDetails[key];
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
  }

}
