angular.module('bhima.controllers')
  .controller('AssetsRegistryController', AssetsRegistryController);

AssetsRegistryController.$inject = [
  'StockService', 'NotifyService', 'uiGridConstants', 'StockModalService', 'ModalService',
  'LanguageService', 'GridGroupingService', 'GridStateService', 'GridColumnService',
  '$state', '$httpParamSerializer', 'BarcodeService', 'AssetsRegistryService', 'bhConstants',
  'ReceiptModal',
];

/**
 * Assets Registry Controller
 * @param Stock
 * @param Notify
 * @param uiGridConstants
 * @param StockModal
 * @param Modal
 * @param Languages
 * @param Grouping
 * @param GridState
 * @param Columns
 * @param $state
 * @param $httpParamSerializer
 * @param Barcode
 * @param AssetsRegistry
 * @param bhConstants
 * @param Receipts
 * @description
 * This module is a registry page for assets
 */
function AssetsRegistryController(
  Stock, Notify, uiGridConstants, StockModal, Modal,
  Languages, Grouping, GridState, Columns,
  $state, $httpParamSerializer, Barcode, AssetsRegistry, bhConstants,
  Receipts,
) {
  const vm = this;
  const cacheKey = 'assets-grid';
  const stockLotFilters = Stock.filter.lot;
  const stockAssignmentFilters = Stock.filter.stockAssign;
  stockLotFilters.remove('includeEmptyLot'); // Cannot be empty lots for assets
  stockLotFilters.remove('period');

  vm.bhConstants = bhConstants;

  vm.assetConditions = bhConstants.assetCondition;

  // grouping box
  vm.groupingBox = AssetsRegistry.groupingBox;

  // barcode scanner
  vm.openAssetBarcodeScanner = openAssetBarcodeScanner;

  // show lot barcode
  vm.openLotBarcodeModal = openLotBarcodeModal;

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider : vm,
    enableColumnMenus : false,
    columnDefs : AssetsRegistry.columnDefs,
    enableSorting : true,
    showColumnFooter : true,
    fastWatch : true,
    flatEntityAccess : true,
    showGridFooter : true,
    gridFooterTemplate : AssetsRegistry.gridFooterTemplate,
    onRegisterApi,
  };

  const gridColumns = new Columns(vm.gridOptions, cacheKey);
  const state = new GridState(vm.gridOptions, cacheKey);

  // expose to the view model
  vm.grouping = new Grouping(vm.gridOptions, false, 'depot_text', true, true);

  vm.getQueryString = Stock.getQueryString;
  vm.clearGridState = clearGridState;
  vm.search = search;
  vm.openColumnConfigModal = openColumnConfigModal;
  vm.loading = false;
  vm.saveGridState = state.saveGridState;

  /**
   *
   * @param gridApi
   */
  function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  }

  // count data rows
  vm.countGridRows = () => vm.gridOptions.data.length;

  // select group
  vm.selectGroup = (group) => {
    if (!group) { return; }
    vm.selectedGroup = group;
  };

  // toggle group
  vm.toggleGroup = (column) => {
    if (vm.grouped) {
      vm.grouping.removeGrouping(column);
      vm.grouped = false;
    } else {
      vm.grouping.changeGrouping(column);
      vm.grouped = true;
    }
  };

  // edit asset
  vm.openAssetModal = (uuid) => {
    StockModal.openAssetEdit({ uuid })
      .then(ans => {
        if (!ans) { return; }
        load(stockLotFilters.formatHTTP(true));
      });
  };

  // initialize module
  /**
   *
   */
  function startup() {
    if ($state.params.filters.length) {
      stockLotFilters.replaceFiltersFromState($state.params.filters);
      stockLotFilters.formatCache();
    }

    load(stockLotFilters.formatHTTP(true));
    vm.latestViewFilters = stockLotFilters.formatView();
  }

  /**
   * @param error
   * @function errorHandler
   * @description
   * Uses Notify to show an error in case the server sends back an information.
   * Triggers the error state on the grid.
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

  // load stock lots in the grid
  /**
   *
   * @param filters
   */
  function load(filters) {
    filters.is_asset = 1;
    if ('is_assigned' in filters) {
      filters.is_assigned = filters.is_assigned === 'ASSET.SHOW_ONLY_ASSIGNED' ? 1 : 0;
    }
    vm.hasError = false;
    toggleLoadingIndicator();
    Stock.assets.getAssetLots(filters)
      .then((assets) => {
        assets.forEach((asset) => {
          // serialize tag names for filters
          asset.tagNames = asset.tags.map(tag => tag.name).join(',');
          asset.tags.forEach(addColorStyle);
        });

        // Add the asset scan condition
        assets.forEach((asset) => {
          const cond = vm.assetConditions.find(c => c.id === asset.scan_condition_id);
          asset.scan_condition = cond ? cond.label : '';
        });

        // FIXME(@jniles): we should do this ordering on the server via an ORDER BY
        assets.sort(AssetsRegistry.orderByDepot);

        vm.gridOptions.data = assets;

        vm.grouping.unfoldAllGroups();
        vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
      })
      .catch(errorHandler)
      .finally(toggleLoadingIndicator);
  }

  /**
   *
   * @param tag
   */
  function addColorStyle(tag) {
    tag.style = { color : tag.color };
  }

  // remove a filter with from the filter object, save the filters and reload
  vm.onRemoveFilter = function onRemoveFilter(key) {
    stockLotFilters.remove(key);
    stockLotFilters.formatCache();
    vm.latestViewFilters = stockLotFilters.formatView();
    return load(stockLotFilters.formatHTTP(true));
  };

  /**
   *
   */
  function search() {
    const filtersSnapshot = stockLotFilters.formatHTTP();

    StockModal.openAssetsSearch(filtersSnapshot)
      .then((changes) => {
        stockLotFilters.replaceFilters(changes);
        stockLotFilters.formatCache();
        vm.latestViewFilters = stockLotFilters.formatView();
        return load(stockLotFilters.formatHTTP(true));
      });
  }

  // This function opens a modal through column service to let the user toggle
  // the visibility of the lots registry's columns.
  /**
   *
   */
  function openColumnConfigModal() {
    // column configuration has direct access to the grid API to alter the current
    // state of the columns - this will be saved if the user saves the grid configuration
    gridColumns.openConfigurationModal();
  }

  // saves the grid's current configuration
  /**
   *
   */
  function clearGridState() {
    state.clearGridState();
    $state.reload();
  }

  /**
   * edit asset scan
   * @param {object} scan
   */
  vm.openAssetScanModal = (scan) => {
    return StockModal.openAssetScanEdit({ uuid : scan.uuid, asset_uuid : scan.asset_uuid })
      .then(ans => {
        if (!ans) { return; }
        load(stockLotFilters.formatHTTP(true));
      });
  };

  /**
   * Create a new asset scan for a specific asset
   * @param {string} asset_uuid
   * @param asset
   */
  vm.createAssetScan = (asset) => {
    vm.openAssetScanModal({ uuid : null, asset_uuid : asset.uuid })
      .then(ans => {
        if (!ans) { return; }
        load(stockLotFilters.formatHTTP(true));
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
            load(stockLotFilters.formatHTTP(true));
            vm.latestViewFilters = stockLotFilters.formatView();
          });
      });
  };

  /**
   * @function addAssignment
   * @description
   * add a stock assignment to the entity
   * @param {string} uuid
   * @param asset
   */
  vm.addAssignment = function addAssignment(asset) {
    StockModal.openActionStockAssign({
      depot_uuid : asset.depot_uuid,
      inventory_uuid : asset.inventory_uuid,
      uuid : asset.uuid,
    })
      .then(() => {
        load(stockLotFilters.formatHTTP(true));
      });
  };

  /**
   * @function deleteAssignment
   * @description
   * remove the stock assignment to the entity
   * @param {string} uuid
   */
  vm.deleteAssignment = function deleteAssignment(uuid) {
    Modal.confirm('ASSIGN.CONFIRM_REMOVE_MSG')
      .then(ans => {
        if (!ans) { return; }

        Stock.stockAssign.remove(uuid)
          .then(() => {
            load(stockAssignmentFilters.formatHTTP(true));
            Notify.success('ASSIGN.REMOVE_SUCCESS');
          })
          .catch(errorHandler);
      });
  };

  // show the receipt
  vm.showAssignmentReceipt = (uuid) => {
    return Receipts.stockAssignmentReceipt(uuid);
  };

  // lot assignment historic
  vm.openHistoricModal = (uuid, depotUuid) => {
    StockModal.openAssignmentHistoric({ uuid, depotUuid });
  };

  vm.exportTo = (renderer) => {
    const filterOpts = stockLotFilters.formatHTTP();
    const defaultOpts = {
      renderer,
      lang : Languages.key,
      displayNames : gridColumns.getDisplayNames(),
    };
    const options = angular.merge(defaultOpts, filterOpts);
    // return  serialized options
    return $httpParamSerializer(options);
  };

  vm.toggleInlineFilter = () => {
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  };

  /**
   * Show all the asset scans for this asset
   * @param {string} uuid - the asset UUID
   * @param asset
   */
  vm.showAssetScans = (asset) => {
    $state.go('stockAssetsScans', {
      filters : [{
        key : 'asset_uuid',
        value : asset.uuid,
        displayValue : asset.label,
        cacheable : false,
      }],
    });
  };

  /**
   *
   */
  function openAssetBarcodeScanner() {
    Barcode.modal({ shouldSearch : false })
      .then(record => {
        stockLotFilters.replaceFilters([
          { key : 'barcode', value : record.uuid, displayValue : record.uuid },
        ]);

        load(stockLotFilters.formatHTTP(true));
        vm.latestViewFilters = stockLotFilters.formatView();
      });
  }

  /**
   * @description display the barcode of the lot in a modal
   * @param {string} uuid the lot uuid
   */
  function openLotBarcodeModal(uuid) {
    return Receipts.lotBarcodeReceipt(uuid);
  }

  startup();
}
