angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('configuration_analysis_tools', {
        url         : '/configuration_analysis_tools',
        controller  : 'ConfigurationAnalysisToolsController as ConfigurationAnalysisToolsCtrl',
        templateUrl : 'modules/configuration_analysis_tools/configuration_analysis_tools.html',
      })

      .state('configuration_analysis_tools.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', configurationAnalysisToolsModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('configuration_analysis_tools.edit', {
        url : '/:id/edit',
        params : {
          id : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', configurationAnalysisToolsModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function configurationAnalysisToolsModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/configuration_analysis_tools/modals/configuration_analysis_tools.modal.html',
    controller : 'ConfigurationAnalysisToolsModalController as ConfigurationAnalysisToolsModalCtrl',
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
