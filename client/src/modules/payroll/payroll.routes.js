angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('payroll', {
        url         : '/payroll',
        controller  : 'PayrollConfigurationController as PayrollConfigurationCtrl',
        templateUrl : 'modules/payroll/payroll.html',
      })

      .state('payroll.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', payrollModal],
        onExit : ['$uibModalStack', closeAllModals],
      })

      .state('payroll.edit', {
        url : '/:id/edit',
        params : {
          id : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', payrollModal],
        onExit : ['$uibModalStack', closeAllModals],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function payrollModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/payroll/modals/payroll.modal.html',
    controller : 'PayrollConfigModalController as PayrollConfigModalCtrl',
    resolve : { params : () => $transition.params('to') },
  }).result.catch(angular.noop);
}

/**
 *
 * @param ModalStack
 */
function closeAllModals(ModalStack) {
  ModalStack.dismissAll();
}
