angular.module('bhima.controllers')
  .controller('monthly_consumption_reportController', monthlyConsumptionReportController);

monthlyConsumptionReportController.$inject = [
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
function monthlyConsumptionReportController($sce, Notify, SavedReports, AppCache, reportData, $state, Languages) {
  const vm = this;
  const cache = new AppCache('monthly_consumption');
  const reportUrl = 'reports/stock/monthly_consumption';

  // default values
  vm.reportDetails = {
    includePurchaseEntry : 1,
  };
  vm.previewGenerated = false;

  // check cached configuration
  checkCachedConfiguration();

  vm.onSelectDepot = depot => {
    vm.reportDetails.depotUuid = depot.uuid;
    vm.reportDetails.depot_text = depot.text;
  };

  vm.onSelectFiscal = function onSelectFiscal(fiscal) {
    vm.reportDetails.fiscal = fiscal;
  };

  vm.onSelectPeriodFrom = function onSelectPeriodFrom(period) {
    vm.reportDetails.periodFrom = period.id;
    vm.reportDetails.periodFromKey = period.translate_key;
  };

  vm.onSelectPeriodTo = function onSelectPeriodTo(period) {
    vm.reportDetails.periodTo = period.id;
    vm.reportDetails.periodToKey = period.translate_key;
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
