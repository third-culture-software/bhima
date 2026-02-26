angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('depots', {
        url         : '/depots',
        controller  : 'DepotManagementController as DepotCtrl',
        templateUrl : 'modules/depots/depots.html',
      })

      .state('depots.create', {
        url : '/create',
        params : {
          parentUuid : { squash : true, value : null },
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', depotModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('depots.edit', {
        url : '/:uuid/edit',
        params : {
          uuid : { value : null, squash : true },
          isCreateState : { value : false },
        },
        onEnter : ['$uibModal', '$transition$', depotModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('depots.management', {
        url : '/:uuid/management',
        params : {
          parentUuid : { squash : true, value : null },
          isManagementState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', managementSupervisionModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('depots.supervision', {
        url : '/:uuid/supervision',
        params : {
          parentUuid : { squash : true, value : null },
          isSupervisionState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', managementSupervisionModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function depotModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/depots/modals/depot.modal.html',
    controller : 'DepotModalController as DepotModalCtrl',
    resolve : { params : () => $transition.params('to') },
  }).result.catch(angular.noop);
}

/**
 *
 * @param $modal
 * @param $transition
 */
function managementSupervisionModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/depots/modals/depotManagementSupervision.modal.html',
    controller : 'DepotManagementSupervisionController as ModalCtrl',
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
