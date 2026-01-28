angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider

      .state('stockLots', {
        url         : '/stock/lots',
        controller  : 'StockLotsController as StockLotsCtrl',
        templateUrl : 'modules/stock/lots/registry.html',
        params : {
          filters : [],
        },
      })

      .state('stockLotsDuplicates', {
        url         : '/stock/lots/duplicates',
        controller  : 'DuplicateLotsController as DupeLotsCtrl',
        templateUrl : 'modules/stock/lots-duplicates/lots-duplicates.html',
        params : {
          filters : [],
        },
      })

      .state('stockMovements', {
        url         : '/stock/movements',
        controller  : 'StockMovementsController as StockCtrl',
        templateUrl : 'modules/stock/movements/registry.html',
        params : {
          filters : [],
        },
      })

      .state('stockInventories', {
        url         : '/stock/inventories',
        controller  : 'StockInventoriesController as StockCtrl',
        templateUrl : 'modules/stock/inventories/registry.html',
        params : {
          filters : [],
        },
      })

      .state('stockExit', {
        url         : '/stock/exit',
        controller  : 'StockExitController as StockCtrl',
        templateUrl : 'modules/stock/exit/exit.html',
        params : {
          shipment : { value : null, squash : true }, // Shipment UUID
        },
        onExit  : ['$uibModalStack', closeModals],
      })

      .state('stockEntry', {
        url         : '/stock/entry',
        controller  : 'StockEntryController as StockCtrl',
        templateUrl : 'modules/stock/entry/entry.html',
        params : {
          shipment : { value : null, squash : true }, // Shipment UUID
        },
        onExit  : ['$uibModalStack', closeModals],
      })

      .state('stockInventoryAdjustment', {
        url         : '/stock/inventory-adjustment',
        controller  : 'StockInventoryAdjustmentController as StockCtrl',
        templateUrl : 'modules/stock/inventory-adjustment/inventory-adjustment.html',
      })

      .state('stockImport', {
        url         : '/stock/import',
        controller  : 'StockImportController as StockCtrl',
        templateUrl : 'modules/stock/import/stockImport.html',
      })

      .state('stockAssets', {
        url         : '/assets',
        controller  : 'AssetsRegistryController as AssetsCtrl',
        templateUrl : 'modules/assets/assets-registry.html',
        params : {
          filters : [],
        },
      })

      .state('stockAssetsScans', {
        url         : '/assets/scans',
        controller  : 'AssetScansRegistryController as ScansCtrl',
        templateUrl : 'modules/asset_scans/asset-scans-registry.html',
        params : {
          filters : [],
        },
      })

      .state('stockReqInventoryScans', {
        url         : '/required/inventory/scans',
        controller  : 'RequiredInventoryScansRegistryController as Ctrl',
        templateUrl : 'modules/required_inventory_scans/required-inventory-scans-registry.html',
        params : {
          filters : [],
        },
      })

      .state('stockAssets.createAssignment', {
        url : '/create',
        params : {
          creating : { value : true },
          filters : [],
        },
        onEnter : ['$state', 'StockModalService', '$transition$', onEnterFactory('create', 'stockAssets')],
        onExit : ['$uibModalStack', closeModals],
      })

      .state('stockRequisition', {
        url         : '/stock/requisition',
        controller  : 'StockRequisitionController as StockCtrl',
        templateUrl : 'modules/stock/requisition/registry.html',
        params : {
          filters : [],
        },
      })
      .state('stockRequisition.create', {
        url : '/create',
        onEnter : ['$state', 'StockModalService', '$transition$', onEnterFactory('create', 'stockRequisition')],
        params : { depot : null },
        onExit : ['$uibModalStack', closeModals],
      })
      .state('stockRequisition.edit', {
        url : '/:uuid/edit',
        params : {
          uuid : { value : null },
        },
        onEnter : ['$state', 'StockModalService', '$transition$', onEnterFactory('edit', 'stockRequisition')],
        onExit : ['$uibModalStack', closeModals],
      })
      .state('stockRequisition.validation', {
        url : '/:uuid/validation',
        params : {
          uuid : { value : null },
        },
        onEnter : ['$state', 'StockModalService', '$transition$', validationModals('stockRequisition')],
        onExit : ['$uibModalStack', closeModals],
      })

      .state('stockSetting', {
        url         : '/stock/setting',
        controller  : 'StockSettingsController as StockSettingsCtrl',
        templateUrl : 'modules/stock/settings/stock-settings.html',
        params : { },
      });

  }]);

/**
 *
 * @param $uibModalStack
 */
function closeModals($uibModalStack) {
  $uibModalStack.dismissAll();
}

// creates both the create and update states
/**
 *
 * @param stateType
 * @param state
 */
function onEnterFactory(stateType, state) {
  const isCreateState = stateType === 'create';

  return function onEnter($state, StockModal, $transition) {
    const transitionParams = $transition.params('to');
    const mapAction = {
      stockAssets : StockModal.openActionStockAssign,
      stockRequisition : StockModal.openActionStockRequisition,
    };
    const instance = mapAction[state];
    instance(transitionParams)
      .then((_uuid) => {
        const params = { uuid : _uuid };

        if (isCreateState) {
          params.created = true;
        } else {
          params.updated = true;
        }

        $state.go(state, params, { reload : true });
      })
      .catch(() => {
        $state.go(state, { uuid : $state.params.id }, { notify : false });
      });
  };
}

// Validation requisition
/**
 *
 * @param state
 */
function validationModals(state) {
  return function onEnter($state, StockModal, $transition) {
    const transitionParams = $transition.params('to');
    const instance = StockModal.openActionValidationRequisition;

    instance(transitionParams)
      .then((_uuid) => {
        const params = { uuid : _uuid, validation : true };

        $state.go(state, params, { reload : true });
      })
      .catch(() => {
        $state.go(state, { uuid : $state.params.id }, { notify : false });
      });
  };
}
