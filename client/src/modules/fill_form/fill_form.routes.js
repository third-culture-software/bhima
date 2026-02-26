angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('fill_form', {
        url         : '/fill_form',
        controller  : 'FillFormController as FillFormCtrl',
        templateUrl : 'modules/fill_form/fill_form.html',
      })

      .state('fill_form.fill', {
        url : '/:id/fill',
        params : {
          isCreateState : { value : true },
        },
        onEnter : ['$uibModal', '$transition$', fillFormModal],
        onExit : ['$uibModalStack', closeModal],
      })

      .state('fill_form.edit', {
        url : '/:id/:uuid/edit',
        params : {
          id : { value : null },
        },
        onEnter : ['$uibModal', '$transition$', fillFormModal],
        onExit : ['$uibModalStack', closeModal],
      });

  }]);

/**
 *
 * @param $modal
 * @param $transition
 */
function fillFormModal($modal, $transition) {
  $modal.open({
    templateUrl : 'modules/fill_form/modals/fill_form.modals.html',
    controller : 'FillFormModalController as FillFormModalCtrl',
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
