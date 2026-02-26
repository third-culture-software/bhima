angular.module('bhima.routes')
  .config(['$stateProvider', ($stateProvider) => {
    $stateProvider
      .state('rubrics', {
        url         : '/payroll/rubrics',
        controller  : 'RubricManagementController as RubricCtrl',
        templateUrl : 'modules/payroll/rubrics/rubrics.html',
      })

      .state('rubrics.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', rubricModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('rubrics.edit', {
        url : '/:id/edit',
        params : {
          id : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', rubricModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function rubricModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/payroll/rubrics/modals/rubric.modal.html',
    controller : 'RubricModalController as RubricModalCtrl',
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
