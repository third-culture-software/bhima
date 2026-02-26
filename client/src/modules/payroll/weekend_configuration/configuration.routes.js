angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('configurationWeekend', {
        url         : '/payroll/weekend_configuration',
        controller  : 'ConfigurationWeekendController as ConfigurationCtrl',
        templateUrl : 'modules/payroll/weekend_configuration/configuration.html',
      })

      .state('configurationWeekend.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', configurationWeekendModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('configurationWeekend.edit', {
        url : '/:id/edit',
        params : {
          id : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', configurationWeekendModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function configurationWeekendModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/payroll/weekend_configuration/modals/weekEnd.modal.html',
    controller : 'WeekendModalController as WeekendModalCtrl',
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
