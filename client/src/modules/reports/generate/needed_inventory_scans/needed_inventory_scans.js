angular.module('bhima.controllers')
  .controller('needed_inventory_scansController', NeededInventoryScansReportController);

NeededInventoryScansReportController.$inject = [
  'RequiredInventoryScansService',
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache', 'reportData', '$state', '$translate',
];

/**
 *
 * @param RequiredInventoryScans
 * @param $sce
 * @param Notify
 * @param SavedReports
 * @param AppCache
 * @param reportData
 * @param $state
 * @param $translate
 */
function NeededInventoryScansReportController(
  RequiredInventoryScans,
  $sce, Notify, SavedReports, AppCache,
  reportData, $state, $translate,
) {
  const vm = this;
  const cache = new AppCache('needed_inventory_scans_report');
  const reportUrl = '/reports/assets/needed_inventory_scans';

  vm.previewGenerated = false;
  vm.loading = false;

  // check cached configuration
  checkCachedConfiguration();

  // NOTE: The IDs below MUST match the IDs getAssets() in server/controllers/stock/core.js
  // @TODO: put these into combined bhConstants and eventually share across client and server
  vm.scanStatusOptions = [
    { id : 'all', name : $translate.instant('ASSET.SCAN_STATUS_ALL') },
    { id : 'scanned', name : $translate.instant('ASSET.SCAN_STATUS_SCANNED') },
    { id : 'unscanned', name : $translate.instant('ASSET.SCAN_STATUS_UNSCANNED') },
  ];

  vm.clear = function clear(key) {
    delete vm[key];
    delete vm.reportDetails[key];
  };

  vm.onSelectRequiredInventoryScan = function onSelectRequiredInventoryScan(scan) {
    vm.requiredInventoryScanUuid = scan.uuid;
    vm.reportDetails.uuid = scan.uuid;
  };

  vm.onSelectScanStatus = function onSelectScanStatus(status) {
    vm.scanStatus = status.id;
    vm.reportDetails.scan_status = status.id;
  };

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  vm.preview = function preview(form) {
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.HAS_ERRORS');
      return 0;
    }

    // update cached configuration
    cache.reportDetails = angular.copy(vm.reportDetails);

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

    // Make sure scanStatus has a default
    if (!angular.isDefined(vm.reportDetails.scanStatus)) {
      vm.scanStatus = 'all';
    }
  }

}
