angular.module('bhima.controllers')
  .controller('InvoicingFeesUpdateController', InvoicingFeesUpdateController);

InvoicingFeesUpdateController.$inject = [
  '$state', 'InvoicingFeesService', '$uibModalInstance', 'util', 'appcache',
];

/**
 * Updates a invoicing fee passed in via a URL parameter.  For example,
 * invoicingFees/1 will update the invoicing fee with id 1.
 *
 * Importantly, both this controller and the InvoicingFeesUpdateController
 * use the same template, invoicing-fees/form.html.
 */
function InvoicingFeesUpdateController($state, InvoicingFees, ModalInstance, util, AppCache) {
  const vm = this;
  const cache = AppCache('InvoicingFees');

  if ($state.params.id) {
    cache.stateParams = $state.params;
    vm.stateParams = cache.stateParams;
  } else {
    vm.stateParams = cache.stateParams;
  }

  // the form title is defined in the JS to allow us to reuse templates
  vm.title = 'INVOICING_FEES.FORM.UPDATE';

  // the label will contain a copy of the invoicing fee's label we are updating
  vm.label = '';

  // this is the InvoicingFeesForm's model
  vm.model = {};

  // the submit method to POST data to the server
  vm.submit = submit;
  vm.dismiss = ModalInstance.dismiss;

  vm.length200 = util.length200;
  vm.maxLength = util.maxTextLength;

  vm.onSelectAccount = onSelectAccount;

  // bhAccountSelect callback
  function onSelectAccount(account) {
    vm.model.account_id = account.id;
  }

  // fired on application startup
  function startup() {

    // load the invoicing fee by id
    InvoicingFees.read(vm.stateParams.id)
      .then((service) => {

        // set the label to the label of the fetched service
        vm.label = service.label;

        // bind the fetched data to the form for editing
        vm.model = service;
      })
      .catch((response) => {
        vm.error = response.data;
      });
  }

  /**
   * submits the form to the server.  If the form does not pass angular form
   * validation, the function will immediately exit.
   *
   * @param {Object} form - the InvoicingFeesForm object
   * @returns {Promise} promise - the $http promise from the InvoicingFeeService's
   *   update() method
   */
  function submit(form) {

    // remove any previously attached messages
    delete vm.error;

    // exit immediately if the form is not valid
    if (form.$invalid) {
      return 0;
    }

    // submit data to the server
    return InvoicingFees.update(vm.stateParams.id, vm.model)
      .then(data => ModalInstance.close(data.id))
      .catch((response) => {
        vm.error = response.data;
      });
  }

  // load initial data from the server
  startup();
}
