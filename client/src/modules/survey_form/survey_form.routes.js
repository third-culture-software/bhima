angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('survey_form', {
        url         : '/survey_form',
        controller  : 'SurveyFormController as SurveyFormCtrl',
        templateUrl : 'modules/survey_form/survey_form.html',
      })

      .state('survey_form.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
          collectorId : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', surveyFormModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('survey_form.edit', {
        url : '/:id/edit',
        params : {
          collectorId : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', surveyFormModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function surveyFormModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/survey_form/modals/survey_form.modals.html',
    controller : 'SurveyFormModalController as SurveyFormModalCtrl',
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
