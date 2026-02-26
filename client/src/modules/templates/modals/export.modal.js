angular.module('bhima.controllers')
  .controller('ExportGridModalController', ExportGridModalController);

ExportGridModalController.$inject = [
  '$uibModalInstance', 'uiGridConstants', '$filter',
  'moment', 'bhConstants', 'data',
];

/**
 *
 * @param Instance
 * @param uiGridConstants
 * @param $filter
 * @param moment
 * @param bhConstants
 * @param Data
 */
function ExportGridModalController(Instance, uiGridConstants, $filter,
  moment, bhConstants, Data) {
  const vm = this;

  const gridOptions = Data.options || {};
  const gridApi = Data.api || {};
  let filename = Data.filename || `Export ${moment().format('YYYY-MM-DD')}`;
  const ROWS = Data.rows || 'visible';
  const COLS = Data.cols || 'visible';

  // bind with view
  vm.exportColType = COLS;
  vm.exportRowType = ROWS;

  // expose to the view
  vm.exportGrid = exportGrid;
  vm.dismiss = Instance.dismiss;

  /**
   * Export to csv
   */
  function exportGrid() {
    const myElement = angular.element(document.querySelectorAll('.ui-grid-exporter-csv-link'));
    filename = vm.filename || filename;
    gridOptions.exporterCsvFilename = filename.concat('.csv');
    gridOptions.exporterHeaderFilter = exporterHeaderFilter;
    gridOptions.exporterOlderExcelCompatibility = true;
    gridApi.exporter.csvExport(vm.exportRowType, vm.exportColType, myElement);
    Instance.close(true);
  }

  /**
   * Exporter apply header filter
   * @param displayName
   */
  function exporterHeaderFilter(displayName) {
    return $filter('translate')(displayName);
  }
}
