angular.module('bhima.routes')
  .config(['$stateProvider', inventoryStateProvider]);

/**
 *
 * @param $stateProvider
 */
function inventoryStateProvider($stateProvider) {
  $stateProvider
    .state('inventoryConfiguration', {
      url : '/inventory/configuration',
      views : {
        '' : {
          templateUrl : 'modules/inventory/configuration/configuration.html',
        },
        'groups@inventoryConfiguration' : {
          templateUrl : 'modules/inventory/configuration/groups/groups.html',
          controller : 'InventoryGroupsController as GroupsCtrl',
        },
        'types@inventoryConfiguration' : {
          templateUrl : 'modules/inventory/configuration/types/types.html',
          controller : 'InventoryTypesController as TypesCtrl',
        },
        'units@inventoryConfiguration' : {
          templateUrl : 'modules/inventory/configuration/units/units.html',
          controller : 'InventoryUnitsController as UnitsCtrl',
        },
      },
    })
    .state('inventory', {
      abstract : true,
      url : '/inventory',
      controller : 'InventoryListController as InventoryCtrl',
      templateUrl : 'modules/inventory/list/list.html',
    })
    .state('inventory.create', {
      url : '/create',
      params : {
        creating : { value : true },
        filters : [],
      },
      onEnter : ['$state', 'ModalService', '$transition$', onEnterInventoryFactory('create')],
      onExit : ['$uibModalStack', closeModal],
    })
    .state('inventory.update', {
      url : '/:uuid/update',
      onEnter : ['$state', 'ModalService', '$transition$', onEnterInventoryFactory('update')],
      onExit : ['$uibModalStack', closeModal],
      params : {
        filters : [],
        uuid : { value : null },
      },
    })
    .state('inventory.list', {
      url : '/:uuid',
      params : {
        uuid : { squash : true, value : null },
        created : false, // default for transitioning from child states
        updated : false, // default for transitioning from child states
        filters : [],
      },
    });
}

/**
 *
 * @param $uibModalStack
 */
function closeModal($uibModalStack) {
  $uibModalStack.dismissAll();
}

// creates both the create and update states
/**
 *
 * @param stateType
 */
function onEnterInventoryFactory(stateType) {
  const isCreateState = (stateType === 'create');

  return function onEnter($state, Modal, $transition) {
    const instance = Modal.openInventoryListActions(null, $transition.params('to'));
    instance
      .then((_uuid) => {
        const params = { uuid : _uuid };

        if (isCreateState) {
          params.created = true;
        } else {
          params.updated = true;
        }

        $state.go('^.list', params, { reload : true });
      })
      .catch(() => {
        $state.go('^.list', { uuid : $state.params.id }, { notify : false });
      });
  };
}
