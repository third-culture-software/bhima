angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {

    $stateProvider
      .state('account_reference', {
        abstract : true,
        url : '/account_reference',
        controller : 'AccountReferenceController as AccountReferenceCtrl',
        templateUrl : 'modules/account_reference/account_reference.html',
        params      : {
          filters : [],
        },
      })
      .state('account_reference.create', {
        url : '/create',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', accountReferenceModal],
        onExit : ['$uibModalStack', closeModal],
      })
      .state('account_reference.list', {
        url : '/:id',
        params : {
          id : { squash : true, value : null },
        },
      })
      .state('account_reference.edit', {
        url : '/:id/edit',
        params : { id : null },
        onEnter : ['$uibModal', '$transition$', accountReferenceModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function accountReferenceModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/account_reference/account_reference.modal.html',
    controller : 'AccountReferenceModalController as AccountReferenceModalCtrl',
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
