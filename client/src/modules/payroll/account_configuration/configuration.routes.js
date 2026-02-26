angular.module('bhima.routes')
  .config(['$stateProvider', ($stateProvider) => {
    $stateProvider
      .state('configurationAccount', {
        url         : '/payroll/account_configuration',
        controller  : 'ConfigurationAccountController as ConfigurationCtrl',
        templateUrl : 'modules/payroll/account_configuration/configuration.html',
      })

      .state('configurationAccount.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', configurationAccountModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('configurationAccount.edit', {
        url : '/:id/edit',
        params : {
          id : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', configurationAccountModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function configurationAccountModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/payroll/account_configuration/modals/account.modal.html',
    controller : 'AccountConfigModalController as AccountConfigModalCtrl',
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
