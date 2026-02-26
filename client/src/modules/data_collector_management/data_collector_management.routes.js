angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('data_collector_management', {
        url         : '/data_collector_management',
        controller  : 'DataCollectorManagementController as DataCollectorManagementCtrl',
        templateUrl : 'modules/data_collector_management/data_collector_management.html',
      })

      .state('data_collector_management.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', dataCollectorManagementModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('data_collector_management.edit', {
        url : '/:id/edit',
        params : {
          id : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', dataCollectorManagementModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function dataCollectorManagementModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/data_collector_management/modals/data_collector_management.modals.html',
    controller : 'DataCollectorManagementModalController as DataCollectorManagementModalCtrl',
    resolve : { params : () => $transition.params('to') },
  }).result.catch(angular.noop);
}

/**
 *
 * @param ModalStack
 */
function closeModal(ModalStack) {
  ModalStack.dismissAll();
}
