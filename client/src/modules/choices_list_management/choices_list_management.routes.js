angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('choices_list_management', {
        url         : '/choices_list_management',
        controller  : 'ChoicesListManagementController as ChoicesListManagementCtrl',
        templateUrl : 'modules/choices_list_management/choices_list_management.html',
      })

      .state('choices_list_management.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
          parentId : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', choicesListManagementModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('choices_list_management.edit', {
        url : '/:id/edit',
        params : {
          id : { value : null },
          isCreateState : { value : false },
        },
        onEnter : ['$uibModal', '$transition$', choicesListManagementModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function choicesListManagementModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/choices_list_management/modals/choices_list_management.modals.html',
    controller : 'ChoicesListManagementModalController as ChoicesListManagementModalCtrl',
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
