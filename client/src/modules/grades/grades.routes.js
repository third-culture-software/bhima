angular.module('bhima.routes')
  .config(['$stateProvider', ($stateProvider) => {
    $stateProvider
      .state('grades', {
        url         : '/grades',
        controller  : 'GradeManagementController as GradeCtrl',
        templateUrl : 'modules/grades/grades.html',
      })

      .state('grades.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', gradeModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('grades.edit', {
        url : '/:uuid/edit',
        params : {
          uuid : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', gradeModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function gradeModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/grades/modals/grade.modal.html',
    controller : 'GradeModalController as GradeModalCtrl',
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
