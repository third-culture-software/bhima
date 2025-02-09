angular.module('bhima.controllers')
  .controller('PatientInvoiceController', PatientInvoiceController);

PatientInvoiceController.$inject = [
  'PatientService', 'PatientInvoiceService', 'PatientInvoiceForm', 'util', 'SessionService',
  'ReceiptModal', 'NotifyService', 'bhConstants', 'ExchangeRateService', 'moment',
];

/**
 * @module PatientInvoiceController
 *
 * @description
 * This module binds the Patient Invoice Form service to the view.
 *
 * @todo (required) Tabbing through UI grid. Code -> Quantity -> Price
 * @todo (required) Invoice made outside of fiscal year error should be handled and shown to user
 */
function PatientInvoiceController(
  Patients, PatientInvoices, PatientInvoiceForm, util, Session, Receipts, Notify,
  Constants, Exchange, moment,
) {
  const vm = this;

  // bind the enterprise to get the enterprise currency id
  vm.enterprise = Session.enterprise;
  vm.supportsPrepayments = Session.enterprise.settings.enable_prepayments;
  vm.Invoice = new PatientInvoiceForm('PatientInvoiceForm');
  vm.ROW_ERROR_FLAG = Constants.grid.ROW_ERROR_FLAG;
  vm.FORBID_PRICE_CHANGES = (Session.enterprise.settings.enable_price_lock);

  // set the enterprise to have access to the enterprise currrency on error messages
  vm.Invoice.setEnterprise(vm.enterprise);

  // bind the date's onChange() function
  vm.onDateChange = (date) => {
    vm.Invoice.details.date = date;
  };

  // application constants
  vm.maxLength = util.maxTextLength;
  vm.minimumDate = util.minimumDate;
  vm.itemIncrement = 1;
  vm.onPatientSearchApiCallback = onPatientSearchApiCallback;

  const gridOptions = {
    appScopeProvider : vm,
    enableSorting : false,
    enableColumnMenus : false,
    rowTemplate : 'modules/templates/grid/error.row.html',
    columnDefs : [{
      field : 'status',
      width : 25,
      displayName : '',
      cellTemplate : 'modules/invoices/templates/grid/status.tmpl.html',
    }, {
      field : 'code',
      displayName : 'TABLE.COLUMNS.CODE',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/invoices/templates/grid/code.tmpl.html',
    }, {
      field : 'description',
      displayName : 'TABLE.COLUMNS.DESCRIPTION',
      headerCellFilter : 'translate',
    }, {
      field : 'quantity',
      displayName : 'TABLE.COLUMNS.QUANTITY',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/invoices/templates/grid/quantity.tmpl.html',
      type : 'number',
    }, {
      field : 'transaction_price',
      displayName : 'FORM.LABELS.UNIT_PRICE',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/invoices/templates/grid/unit_price.tmpl.html',
      type : 'number',
    }, {
      field : 'amount',
      displayName : 'TABLE.COLUMNS.AMOUNT',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/invoices/templates/grid/amount.tmpl.html',
      type : 'number',
    }, {
      field : 'actions',
      width : 25,
      cellTemplate : 'modules/invoices/templates/grid/actions.tmpl.html',
    }],
    onRegisterApi : exposeGridScroll,
    data : vm.Invoice.store.data,
  };

  // called when the grid is initialized
  function exposeGridScroll(gridApi) {
    vm.gridApi = gridApi;
  }

  function setPatient(p) {
    const { uuid } = p;
    Patients.read(uuid)
      .then(patient => {
        vm.Invoice.setPatient(patient);
      });
  }

  // invoice total and items are successfully sent and written to the server
  function submit(detailsForm) {
    let firstInvalidItem;

    vm.Invoice.writeCache();

    // update value for form validation
    detailsForm.$setSubmitted();

    // make sure there are actually items to validate
    if (vm.Invoice.store.data.length === 0) {
      Notify.danger('PATIENT_INVOICE.INVALID_ITEMS');
      return 0;
    }

    // ask service items to validate themselves - if anything is returned it is invalid
    const invalidItems = vm.Invoice.validate(true);

    if (invalidItems.length) {
      [firstInvalidItem] = invalidItems;
      Notify.danger(firstInvalidItem._message);

      // show the user where the error is
      vm.gridApi.core.scrollTo(firstInvalidItem);
      return 0;
    }

    // if the form is invalid, return right away
    if (detailsForm.$invalid) {
      Notify.danger('FORM.ERRORS.RECORD_ERROR');
      return 0;
    }

    // copy the rows for insertion
    const items = angular.copy(vm.Invoice.store.data);

    const description = vm.Invoice.getTemplatedDescription();

    // invoice consists of
    // 1. Invoice details
    // 2. Invoice items
    // 3. Charged invoicing fees - each of these have the global charge calculated by the client
    // 4. Charged subsidies - each of these have the global charge calculated by the client
    return PatientInvoices.create(
      vm.Invoice.details,
      items,
      description,
      vm.Invoice.invoicingFees, vm.Invoice.subsidies)
      .then(result => {
        detailsForm.$setPristine();
        detailsForm.$setUntouched();
        return result;
      })
      .then(handleCompleteInvoice)
      .catch(Notify.handleError);
  }

  // this function will be called whenever items change in the grid.
  function handleUIGridChange() {
    vm.Invoice.digest();
  }

  // adds n items to the grid (unless the inventory is used up)
  function addItems(n) {
    let i = n;
    while (i--) {
      vm.Invoice.addItem();
    }
  }

  function handleCompleteInvoice(invoice) {
    vm.Invoice.clearCache();

    Receipts.invoice(invoice.uuid, true)
      .then(() => { clear(); });
  }

  // register the patient search api
  function onPatientSearchApiCallback(api) {
    vm.patientSearchApi = api;
  }

  // reset everything in the controller - default values
  function clear(detailsForm) {
    // set timestamp to today
    vm.timestamp = moment();

    vm.Invoice.setup();

    if (detailsForm) {
      detailsForm.$setPristine();
      detailsForm.$setUntouched();
    }

    // reset the find patient component
    if (vm.patientSearchApi) {
      vm.patientSearchApi.reset();
    }

    // reset client balance
    vm.patientBalance = null;
  }

  // select service
  vm.onSelectService = (service) => {
    vm.Invoice.details.service_uuid = service.uuid;
  };

  vm.gridOptions = gridOptions;
  vm.setPatient = setPatient;
  vm.submit = submit;
  vm.clear = clear;
  vm.addItems = addItems;
  vm.handleChange = handleUIGridChange;

  // Set initial default values
  clear();
}
