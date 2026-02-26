angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('entities', {
        url         : '/entities',
        controller  : 'EntityController as EntityCtrl',
        templateUrl : 'modules/entities/entities.html',
      })

      .state('entities.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', entityModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('entities.edit', {
        url : '/:uuid/edit',
        params : {
          uuid : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', entityModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('entities_type', {
        url         : '/entities_type',
        controller  : 'EntityTypeController as EntityTypeCtrl',
        templateUrl : 'modules/entities/types/types.html',
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function entityModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/entities/modals/entity.modal.html',
    controller : 'EntityModalController as EntityModalCtrl',
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
