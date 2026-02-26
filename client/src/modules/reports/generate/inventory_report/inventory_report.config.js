angular.module('bhima.controllers')
  .controller('inventory_reportController', InventoryReportConfigController);

InventoryReportConfigController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache', 'reportData', '$state',
  'LanguageService', 'moment',
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
 * @param moment
 */
function InventoryReportConfigController(
  $sce, Notify, SavedReports, AppCache, reportData, $state,
  Languages, moment,
) {
  const vm = this;
  const cache = new AppCache('configure_stock_report');
  const reportUrl = 'reports/stock/inventories';

  vm.previewGenerated = false;

  vm.dateTo = new Date();
  vm.includeEmptyLot = 1;

  // chech cached configuration
  checkCachedConfiguration();

  vm.onSelectIncludeEmptyLot = (value) => {
    vm.includeEmptyLot = value;
  };

  vm.onSelectDepot = function onSelectDepot(depot) {
    vm.depot = depot;
  };

  vm.onSelectInventory = function onSelectInventory(inventory) {
    vm.inventory = inventory;
  };

  vm.onSelectDate = (date) => {
    vm.dateTo = date;
  };

  vm.clear = function clear(key) {
    delete vm[key];
  };

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  vm.preview = function preview(form) {
    if (form.$invalid) { return 0; }

    if (!vm.chooseOneDepot) { vm.depot = {}; }
    if (!vm.chooseOneInventory) { vm.inventory = {}; }

    const params = {
      depot_uuid : vm.depot.uuid,
      inventory_uuid : vm.inventory.uuid,
      dateTo : vm.dateTo,
      includeEmptyLot : vm.includeEmptyLot,
    };

    // update cached configuration
    cache.reportDetails = angular.copy(params);

    // format date for the server
    params.dateTo = moment(params.dateTo).format('YYYY-MM-DD');

    const options = { lang : Languages.key, ...params };

    vm.reportDetails = options;

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
