angular.module('bhima.controllers')
  .controller('stock_movement_reportController', StockMovementReportCtrl);

StockMovementReportCtrl.$inject = [
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
function StockMovementReportCtrl($sce, Notify, SavedReports, AppCache, reportData, $state, Languages) {
  const vm = this;
  const cache = new AppCache('stock_movement_report');
  const reportUrl = 'reports/stock/movement_report';

  // default values
  vm.reportDetails = {
    reportType : 'movement_count',
  };

  vm.previewGenerated = false;

  // check cached configuration
  checkCachedConfiguration();

  vm.onSelectDepot = depot => {
    vm.reportDetails.depot_uuid = depot.uuid;
  };

  vm.onFluxChange = function onFluxChange(fluxes) {
    vm.reportDetails.flux_id = fluxes.map(f => f.id);
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
  }

}
