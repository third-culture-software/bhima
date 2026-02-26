angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('entityGroup', {
        url         : '/entity_group',
        controller  : 'EntityGroupController as EntityGroupCtrl',
        templateUrl : 'modules/entity_group/entity_group.html',
      })

      .state('entityGroup.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', entityGroupModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('entityGroup.edit', {
        url : '/:uuid/edit',
        params : {
          uuid : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', entityGroupModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function entityGroupModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/entity_group/modals/entity_group.modal.html',
    controller : 'EntityGroupModalController as EntityGroupModalCtrl',
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
