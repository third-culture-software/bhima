angular.module('bhima.routes')
  .config(['$stateProvider', ($stateProvider) => {
    $stateProvider
      .state('functions', {
        url: '/functions',
        controller: 'FunctionManagementController as FunctionCtrl',
        templateUrl: 'modules/functions/functions.html',
      })

      .state('functions.create', {
        url: '/create',
        params: {
          isCreateState: { value: true },
        },
        onEnter: ['$uibModal', '$transition$', functionModal],
        onExit: ['$uibModalStack', closeModal],
      })

      .state('functions.edit', {
        url: '/:id/edit',
        params: {
          id: { value: null },
        },
        onEnter: ['$uibModal', '$transition$', functionModal],
        onExit: ['$uibModalStack', closeModal],
      });
  }]);

function functionModal($modal, $transition) {
  $modal.open({
    templateUrl: 'modules/functions/modals/function.modal.html',
    controller: 'FunctionModalController as FunctionModalCtrl',
    resolve: { params: () => $transition.params('to') },
  }).result.catch(angular.noop);
}

function closeModal(ModalStack) {
  ModalStack.dismissAll();
}
