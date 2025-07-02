angular.module('bhima.controllers')
  .controller('InvoicingFeesDeleteController', InvoicingFeesDeleteController);

InvoicingFeesDeleteController.$inject = [
  '$state', '$uibModalInstance', 'InvoicingFeesService',
];

/**
 * invoicing fees Delete Controller
 *
 * This is a super simple controller to ensure that errors are properly handled
 * and translated on the invoicing fees modal.  It leverages the shared
 * ConfirmModal template.
 *
 * This controller is instantiated in a modal.
 */
function InvoicingFeesDeleteController($state, Instance, InvoicingFees) {
  const vm = this;

  // bind methods to the view
  vm.dismiss = Instance.dismiss;
  vm.submit = submit;
  vm.prompt = 'FORM.DIALOGS.CONFIRM_DELETE';

  // submit a delete request to the server
  function submit() {
    // clear the error, if it exists
    delete vm.error;

    // attempt to delete the invoicing fee
    return InvoicingFees.delete($state.params.id)
      .then(() => {
        // if successful, close the modal instance
        Instance.close();
      })
      .catch(Instance.dismiss);
  }
}
