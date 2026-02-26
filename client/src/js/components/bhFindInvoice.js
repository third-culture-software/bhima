angular.module('bhima.components')
  .component('bhFindInvoice', {
    controller : FindInvoiceComponent,
    templateUrl : 'modules/templates/bhFindInvoice.tmpl.html',
    bindings : {
      patientUuid :       '<?', // patient uuid - to restrict search to this patient
      invoiceUuid :       '<?', // if a uuid exists, pass it in here.
      onSearchComplete :  '&', // bind callback to call when data is available
      disabled :          '<?', // bind disable behavior
    },
  });

FindInvoiceComponent.$inject = [
  'PatientInvoiceService', 'NotifyService', '$window',
];

/**
 * The Find Invoice Component
 * @param PatientInvoice
 * @param Notify
 * @param $window
 */
function FindInvoiceComponent(PatientInvoice, Notify, $window) {
  const $ctrl = this;

  /* @const the enter key keycode */
  const ENTER_KEY = 13;

  const translate = {
    name : '',
  };

  $ctrl.$onInit = function onInit() {
    $ctrl.disabled = $ctrl.disabled || false;
  };

  $ctrl.$onChanges = function $onChanges(changes) {
    if (changes && changes.invoiceUuid && changes.invoiceUuid.currentValue) {
      lookupInvoiceByUuid(changes.invoiceUuid.currentValue);
    }
  };

  /* Expose functions and variables to the template view */
  $ctrl.search = search;
  $ctrl.onKeyPress = onKeyPress;
  $ctrl.translate = translate;

  /**
   * @param form
   * @function search
   * @description
   * Fired when the user uses the search form to look up an invoice via its
   * reference.
   */
  function search(form) {
    const parameters = {
      invoiceReference : $ctrl.invoiceReference,
      patientUuid : $ctrl.patientUuid,
    };

    PatientInvoice.findConsumableInvoicePatient(parameters)
      .then(invoice => {

        // trigger form validation for the invoice search input
        form.$setSubmitted();

        if (!invoice || !invoice.details) {
          $ctrl.invoiceFound = false;
          return;
        }

        // select invoice and fetch articles and services in the invoice
        selectInvoice(invoice);
      })
      .catch(Notify.handleError);
  }

  /**
   * @param invoiceUuid
   * @function lookupInvoiceByUuid
   * @description
   * Fired when an invoiceUuid is passed in from outside of the component.
   */
  function lookupInvoiceByUuid(invoiceUuid) {
    const parameters = { invoiceUuid };
    if ($ctrl.patientUuid) {
      parameters.patientUuid = $ctrl.patientUuid;
    }

    PatientInvoice.findConsumableInvoicePatient(parameters)
      .then(invoice => {

        if (!invoice || !invoice.details) {
          $ctrl.invoiceFound = false;
          return;
        }

        $ctrl.invoiceReference = invoice.details.reference;

        // select invoice and fetch articles and services in the invoice
        selectInvoice(invoice);
      })
      .catch(Notify.handleError);
  }

  /**
   * @function selectInvoice
   * @param {object} invoice The invoice object
   * @description
   * This function attaches the invoice to the controller, templates in the
   * values, and calls the callback.
   */
  function selectInvoice(invoice) {
    $ctrl.invoiceFound = true;

    const elementId = 'search-button';
    const searchButton = $window.document.getElementById(elementId);

    if (invoice && angular.isObject(invoice)) {
      $ctrl.translate.name = invoice.details.debtor_name;
      $ctrl.invoiceDescription = invoice.details.description;
      $ctrl.invoiceItems = invoice.items.map(item => `${item.text}: ${item.quantity} ${item.inventory_unit}`);

      // call the external function with patient
      $ctrl.onSearchComplete({ invoice });

      // set focus on the search button after a search
      searchButton.focus();
    }
  }

  /**
   * @function onKeyPress
   * @param {object} event - a DOM event bubbled up to the function
   * @param form
   * @description
   * This function capture the "Enter" key push of the user and call a function
   * to do something.
   */
  function onKeyPress(event, form) {

    // submit the find-invoice form
    if (event.keyCode === ENTER_KEY) {
      $ctrl.search(form);
      event.preventDefault();
    }
  }
}
