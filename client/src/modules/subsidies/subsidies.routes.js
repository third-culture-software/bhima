angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('subsidies', {
        url         : '/subsidies',
        controller  : 'SubsidyController as SubsidyCtrl',
        templateUrl : 'modules/subsidies/subsidies.html',
      })

      .state('subsidies.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', subsidyModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('subsidies.edit', {
        url : '/:id/edit',
        params : {
          id : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', subsidyModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function subsidyModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/subsidies/modals/subsidies.modal.html',
    controller : 'SubsidyModalController as SubsidyModalCtrl',
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
