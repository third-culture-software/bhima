angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('account_reference_type', {
        url         : '/account_reference_type',
        controller  : 'AccountReferenceTypeController as AccountReferenceTypeCtrl',
        templateUrl : 'modules/account_reference_type/account_reference_type.html',
      })
      .state('account_reference_type.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', accountReferenceTypeModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('account_reference_type.edit', {
        url : '/:id/edit',
        params : {
          id : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', accountReferenceTypeModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function accountReferenceTypeModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/account_reference_type/modals/account_reference_type.modal.html',
    controller : 'AccountReferenceTypeModalController as AccountReferenceTypeModalCtrl',
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
