angular.module('bhima.controllers')
  .controller('InvoicingFeesCreateController', InvoicingFeesCreateController);

InvoicingFeesCreateController.$inject = [
  'InvoicingFeesService', '$uibModalInstance', 'util',
];

/**
 * Invoicing Fees Create Controller
 *
 * This controller allows the user to create a new invoicing fees using a form.
 * Note that this uses the same HTML form as the update controller
 */
function InvoicingFeesCreateController(InvoicingFees, ModalInstance, util) {
  const vm = this;

  // the form title is defined in the JS to allow us to reuse templates
  vm.title = 'INVOICING_FEES.FORM.CREATE';

  // this is the CreateForm's model
  vm.model = {};

  // bind the submit method to POST data to the server
  vm.submit = submit;
  vm.dismiss = ModalInstance.dismiss;

  vm.length200 = util.length200;
  vm.maxLength = util.maxTextLength;
  vm.onSelectAccount = onSelectAccount;

  // bhAccountSelect callback
  function onSelectAccount(account) {
    vm.model.account_id = account.id;
  }

  /**
   * submits the form to the server.  If the form does not pass angular form
   * validation, the function will immediately exit.
   *
   * @param {Object} form - the CreateForm object
   * @returns {Promise} promise - the $http promise from the InvoicingFeeservice's
   *   create() method
   */
  function submit(form) {

    // remove any previously attached messages
    delete vm.error;

    // exit immediately if the form is not valid
    if (form.$invalid) {
      return 0;
    }

    // submit data to the server
    return InvoicingFees.create(vm.model)
      .then((data) => ModalInstance.close(data.id))
      .catch((response) => {
        vm.error = response.data;
      });
  }
}
