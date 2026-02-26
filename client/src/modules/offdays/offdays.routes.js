angular.module('bhima.routes')
  .config(['$stateProvider', ($stateProvider) => {
    $stateProvider
      .state('offdays', {
        url         : '/offdays',
        controller  : 'OffdayManagementController as OffdayCtrl',
        templateUrl : 'modules/offdays/offdays.html',
      })

      .state('offdays.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', offdayModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('offdays.edit', {
        url : '/:id/edit',
        params : { id : { value : null } },
        onEnter : ['$uibModal', '$transition$', offdayModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function offdayModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/offdays/modals/offday.modal.html',
    controller : 'OffdayModalController as OffdayModalCtrl',
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
