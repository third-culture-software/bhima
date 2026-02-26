angular.module('bhima.routes')
  .config(['$stateProvider', ($stateProvider) => {
    $stateProvider
      .state('titles', {
        url         : '/titles',
        controller  : 'TitleManagementController as TitleCtrl',
        templateUrl : 'modules/titles/titles.html',
      })

      .state('titles.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', titleModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('titles.edit', {
        url : '/:id/edit',
        params : {
          id : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', titleModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function titleModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/titles/modals/title.modal.html',
    controller : 'TitleModalController as TitleModalCtrl',
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
