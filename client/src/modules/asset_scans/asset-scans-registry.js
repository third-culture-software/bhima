angular.module('bhima.controllers')
  .controller('AssetScansRegistryController', AssetScansRegistryController);

AssetScansRegistryController.$inject = [
  'StockService', 'AssetsScanService', 'AssetsScansRegistryService',
  'StockModalService', 'DepotService', 'BarcodeService',
  'GridStateService', 'GridColumnService', 'GridGroupingService',
  'NotifyService', '$state', 'bhConstants',
  'uiGridConstants', 'LanguageService', '$httpParamSerializer',
];

/**
 * Assets Registry Controller
 * This module is a registry page for assets
 * @param Stock
 * @param AssetsScans
 * @param AssetsScansRegistryService
 * @param StockModal
 * @param Depots
 * @param Barcode
 * @param GridState
 * @param Columns
 * @param Grouping
 * @param Notify
 * @param $state
 * @param bhConstants
 * @param uiGridConstants
 * @param Languages
 * @param $httpParamSerializer
 */
function AssetScansRegistryController(
  Stock, AssetsScans, AssetsScansRegistryService,
  StockModal, Depots, Barcode,
  GridState, Columns, Grouping,
  Notify, $state, bhConstants,
  uiGridConstants, Languages, $httpParamSerializer,
) {
  const vm = this;
  const cacheKey = 'assets-scans-grid';

  vm.conditions = bhConstants.assetCondition;

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider : vm,
    enableColumnMenus : false,
    columnDefs : AssetsScansRegistryService.columnDefs,
    enableSorting : true,
    showColumnFooter : true,
    fastWatch : true,
    flatEntityAccess : true,
    // showGridFooter : true,
    //  gridFooterTemplate : AssetsRegistry.gridFooterTemplate,
    onRegisterApi,
  };

  const gridColumns = new Columns(vm.gridOptions, cacheKey);
  const state = new GridState(vm.gridOptions, cacheKey);

  // options for the UI grid
  vm.loading = false;
  vm.saveGridState = state.saveGridState;

  // expose to the view model
  vm.grouping = new Grouping(vm.gridOptions, false, 'depot_text', true, true);

  vm.filters = AssetsScansRegistryService.filters;

  vm.toggleInlineFilter = toggleInlineFilter;

  /**
   * edit asset scan
   * @param {object} scan
   */
  vm.openAssetScanModal = (scan) => {
    return StockModal.openAssetScanEdit({ uuid : scan.uuid, asset_uuid : scan.asset_uuid })
      .then(ans => {
        if (!ans) { return; }
        load(vm.filters.formatHTTP(true));
      });
  };

  /**
   * Create a new asset scan for a specific asset
   * @param {string} asset_uuid
   * @param scan
   */
  vm.createAssetScan = (scan) => {
    vm.openAssetScanModal({ uuid : null, asset_uuid : scan.asset_uuid })
      .then(ans => {
        if (!ans) { return; }
        load(vm.filters.formatHTTP(true));
      });
  };

  /**
   * Create a new asset scan
   */
  vm.newAssetScan = () => {
    Barcode.modal({ shouldSearch : false, title : 'ASSET.SCAN_ASSET_BARCODE' })
      .then(record => {
        Stock.lots.read(null, { barcode : record.uuid })
          .then(assets => {
            if (assets.length > 0) {
              const [asset] = assets;
              return asset;
            }
            return Notify.danger('ASSET.BARCODE_NOT_FOUND');
          })
          .then(asset => {
            if (asset) {
              return vm.openAssetScanModal({ uuid : null, asset_uuid : asset.uuid });
            }
            return null;
          })
          .then(ans => {
            if (!ans) { return; }
            load(vm.filters.formatHTTP(true));
            vm.latestViewFilters = vm.filters.formatView();
          });
      });
  };

  /**
   * initialize the module
   */
  function startup() {
    if ($state.params.filters.length) {
      vm.filters.replaceFiltersFromState($state.params.filters);
      vm.filters.cacheFilters();
    }

    load(vm.filters.formatHTTP(true));
    vm.latestViewFilters = vm.filters.formatView();
  }

  // load the assets scans into the grid
  /**
   *
   * @param filters
   */
  function load(filters) {
    vm.hasError = false;
    toggleLoadingIndicator();
    AssetsScans.list(filters)
      .then(scans => {
        scans.forEach(scn => {
          const cond = vm.conditions.find(s => s.id === scn.condition_id);
          scn.condition_label = cond.label;
        });
        vm.gridOptions.data = scans;
        vm.grouping.unfoldAllGroups();
      })
      .catch(errorHandler)
      .finally(toggleLoadingIndicator);
  }

  /**
   *
   * @param gridApi
   */
  function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  }

  /**
   * remove a filter with from the filter object, save the filters and reload
   * @param {string} key
   * @returns result of load
   */
  vm.onRemoveFilter = function onRemoveFilter(key) {
    vm.filters.removeFilter(key);
    vm.filters.cacheFilters();
    vm.latestViewFilters = vm.filters.formatView();
    return load(vm.filters.formatHTTP(true));
  };

  /**
   * @function errorHandler
   * @description
   * Uses Notify to show an error in case the server sends back an information.
   * Triggers the error state on the grid.
   * @param {object} error
   */
  function errorHandler(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  /**
   * @function toggleLoadingIndicator
   * @description
   * Toggles the grid's loading indicator to eliminate the flash when rendering
   * lots movements and allow a better UX for slow loads.
   */
  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  /**
   * Open Search modal
   */
  vm.search = function search() {
    const filtersSnapshot = vm.filters.formatHTTP();
    StockModal.openAssetScansSearch(filtersSnapshot)
      .then((changes) => {
        if (!changes) { return null; }

        vm.filters.replaceFilters(changes);
        vm.filters.cacheFilters();
        vm.latestViewFilters = vm.filters.formatView();
        return load(vm.filters.formatHTTP(true));
      });
  };

  /**
   *
   */
  function toggleInlineFilter() {
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  // This function opens a modal through column service to let the user toggle
  // the visibility of the lots registry's columns.
  vm.openColumnConfigModal = function openColumnConfigModal() {
    // column configuration has direct access to the grid API to alter the current
    // state of the columns - this will be saved if the user saves the grid configuration
    gridColumns.openConfigurationModal();
  };

  // saves the grid's current configuration
  vm.clearGridState = function clearGridState() {
    state.clearGridState();
    $state.reload();
  };

  // downloads a the registry as a given type (pdf, csv)
  vm.download = function download(type) {
    const filterOpts = vm.filters.formatHTTP();

    const defaultOpts = { renderer : type, lang : Languages.key };

    // combine options
    const options = angular.merge(defaultOpts, filterOpts);

    // return  serialized options
    return $httpParamSerializer(options);
  };

  startup();
}
