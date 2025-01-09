angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('ipr_tax', {
        url         : '/ipr_tax',
        controller  : 'IprTaxManagementController as IprTaxCtrl',
        templateUrl : 'modules/ipr_tax/ipr_tax.html',
      })

      .state('iprConfiguration', {
        url         : '/ipr_tax/configuration',
        controller  : 'IprTaxConfigurationController as IprTaxConfigCtrl',
        templateUrl : 'modules/ipr_tax/configuration/iprTaxConfig.html',
      })

      .state('ipr_tax.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', iprTaxModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('iprConfiguration.createConfig', {
        url : '/:taxIprId/create',
        params : {
          isCreateState : { value : true },
          taxIprId : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', iprTaxConfigModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('ipr_tax.edit', {
        url : '/:id/edit',
        params : {
          id : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', iprTaxModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('iprConfiguration.editConfig', {
        url : '/:taxIprId/edit/:id',
        params : {
          taxIprId : { value : null },
          id : { value : null },
          isCreateState : { value : false },
        },
        onEnter : ['$uibModal', '$transition$', iprTaxConfigModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

function iprTaxModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/ipr_tax/modals/ipr_tax.modal.html',
    controller : 'IprTaxModalController as IprTaxModalCtrl',
    resolve : { params : () => $transition.params('to') },
  }).result.catch(angular.noop);
}

function iprTaxConfigModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/ipr_tax/modals/ipr_tax_config.modal.html',
    controller : 'IprTaxConfigModalController as IprTaxConfigModalCtrl',
    resolve : { params : () => $transition.params('to') },
  }).result.catch(angular.noop);
}

function closeModal(ModalStack) {
  ModalStack.dismissAll();
}
