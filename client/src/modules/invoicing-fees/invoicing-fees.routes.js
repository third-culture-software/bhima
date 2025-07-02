angular.module('bhima.routes')
  .config(['$stateProvider', function InvoiceFeesRoutes($stateProvider) {

    /**
     * Invoicing Fee Routes
     *
     * The invoicing fees route endpoints.
     *
     * @todo - discuss if the "delete" route should be included as a separate
     * view/state.  It doesn't really need to be deep-linked.
     */
    $stateProvider
      .state('invoicingFees', {
        url         : '/invoicing_fees',
        abstract    : true,
        templateUrl : 'modules/invoicing-fees/invoicing-fees.html',
        controller  : 'InvoicingFeesController as InvoicingFeesCtrl',
      })
      .state('invoicingFees.create', {
        url     : '/create',
        onEnter : ['$state', '$uibModal', 'NotifyService', onInvoicingFeeEnterFactory('create')],
        onExit  : ['$uibModalStack', closeModal],
      })
      .state('invoicingFees.list', {
        url    : '/{id:int}',
        params : {
          id      : { squash : true, value : null },
          created : false, // default for transitioning from child states
          updated : false, // default for transitioning from child states
        },
      })
      .state('invoicingFees.update', {
        url     : '/{id:int}/update',
        onEnter : ['$state', '$uibModal', 'NotifyService', onInvoicingFeeEnterFactory('update')],
        onExit  : ['$uibModalStack', closeModal],
      })
      .state('invoicingFees.delete', {
        url     : '/{id:int}/delete',
        onEnter : ['$state', '$uibModal', 'NotifyService', function onEnterState($state, Modal, Notify) {
          Modal.open({
            keyboard    : true,
            size        : 'md',
            controller  : 'InvoicingFeesDeleteController as ConfirmModalCtrl',
            templateUrl : '/modules/templates/modals/confirm.modal.html',
          }).result
            .then(() => {
              Notify.success('FORM.INFO.DELETE_SUCCES');

              // go to the parent state (with refresh)
              $state.go('^.list', { id : null }, { reload : true });
            })
            .catch((error) => {
              if (error) {
                Notify.handleError(error);
              }

              $state.go('^.list', { id : $state.params.id }, { notify : false });
            });
        }],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 * @function onEnterFactory
 *
 * @description
 * This configures the update versus create states.
 */
function onInvoicingFeeEnterFactory(stateType) {
  const isCreateState = (stateType === 'create');

  const ctrl = isCreateState
    ? 'InvoicingFeesCreateController as InvoicingFeesFormCtrl'
    : 'InvoicingFeesUpdateController as InvoicingFeesFormCtrl';

  const message = isCreateState
    ? 'FORM.INFO.CREATE_SUCCESS'
    : 'FORM.INFO.UPDATE_SUCCESS';

  return function onEnter($state, Modal, Notify) {
    Modal.open({
      templateUrl : 'modules/invoicing-fees/invoicing-fees-modal.html',
      controller  : ctrl,
    }).result
      .then((id) => {
        Notify.success(message);

        const params = isCreateState
          ? { id, created : true }
          : { id, updated : true };

        // go to the parent state (with refresh)
        $state.go('^.list', params, { reload : true });
      })
      .catch((error) => {

        if (error) {
          Notify.handleError(error);
        }

        $state.go('^.list', { id : $state.params.id }, { notify : false });
      });
  };
}

function closeModal($uibModalStack) {
  $uibModalStack.dismissAll();
}
