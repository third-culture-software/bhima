angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('multiple_payroll_indice', {
        url         : '/multiple_payroll_indice',
        controller  : 'MultiplePayrollIndiceController as MultiplePayrollCtrl',
        templateUrl : 'modules/multiple_payroll_indice/multiple_payroll_indice.html',
        params : { filters : [] },
      })

      .state('multiple_payroll_indice.config', {
        url : '/:uuid/config',
        params : {
          uuid : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', configurationMultipleIndicePayroll],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function configurationMultipleIndicePayroll($modal, $transition) {
  $modal.open({
    size : 'lg',
    templateUrl : 'modules/multiple_payroll_indice/modals/config.modal.html',
    controller : 'ConfigIndicePaiementModalController as ConfigPaiementModalCtrl',
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
