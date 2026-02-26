angular.module('bhima.routes')
  .config(['$stateProvider', ($stateProvider) => {
    $stateProvider

      .state('services', {
        url         : '/services',
        controller  : 'ServicesController as ServicesCtrl',
        templateUrl : 'modules/services/services.html',
      })

      .state('services.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', serviceModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('services.edit', {
        url : '/edit',
        params : {
          service : { value : null },
          isCreateState : { value : false },
        },
        onEnter : ['$uibModal', '$transition$', serviceModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function serviceModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/services/modals/service.modal.html',
    controller : 'ServiceModalController as ServiceModalCtrl',
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
