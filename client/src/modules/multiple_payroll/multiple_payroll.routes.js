angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('multiple_payroll', {
        url         : '/multiple_payroll',
        controller  : 'MultiplePayrollController as MultiplePayrollCtrl',
        templateUrl : 'modules/multiple_payroll/multiple_payroll.html',
        params : { filters : [] },
      })

      .state('multiple_payroll.config', {
        url : '/:paymentPeriodId/config/:employeeUuid',
        params : {
          employeeUuid : { value : null },
          paymentPeriodId : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', configurationMultiplePayroll],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function configurationMultiplePayroll($modal, $transition) {
  $modal.open({
    size : 'lg',
    templateUrl : 'modules/multiple_payroll/modals/config.modal.html',
    controller : 'ConfigPaymentModalController as ConfigPaymentModalCtrl',
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
