angular.module('bhima.controllers')
  .controller('StockFindPatientModalController', StockFindPatientModalController);

StockFindPatientModalController.$inject = [
  '$uibModalInstance', 'PatientService', 'NotifyService', 'data',
  'BarcodeService', 'DebtorService', 'PatientInvoiceService', 'SessionService',
];

/**
 *
 * @param Instance
 * @param Patients
 * @param Notify
 * @param Data
 * @param Barcodes
 * @param Debtors
 * @param PatientInvoice
 * @param Session
 */
function StockFindPatientModalController(Instance, Patients, Notify, Data, Barcodes, Debtors,
  PatientInvoice, Session) {
  const vm = this;

  // global
  vm.selected = {};
  vm.patientInvoices = [];
  vm.loading = false;

  // these come from the stock settings menu
  const numInvoicesDisplayed = Session.stock_settings.num_invoices_displayed || 5;

  // bind methods
  vm.setPatient = setPatient;
  vm.setInvoice = setInvoice;
  vm.submit = submit;
  vm.cancel = () => Instance.close();

  vm.openBarcodeScanner = openBarcodeScanner;
  vm.enterprise = Session.enterprise;

  vm.loadAllInvoices = loadAllInvoices;
  vm.getInvoiceDetails = getInvoiceDetails;

  if (Data.entity_uuid) {
    vm.loading = true;
    Patients.read(Data.entity_uuid)
      .then(patient => {
        return setPatient(patient);
      })
      .catch(err => {
        if (err.statusCode === 404) {
          setPatient({});
        } else {
          Notify.handleError(err);
        }
      })
      .finally(() => { vm.loading = false; });
  }

  /**
   *
   * @param patient
   */
  function setPatient(patient) {
    vm.selected = patient;
    return loadRecentInvoices();
  }

  /**
   * @function loadRecentInvoices
   */
  function loadRecentInvoices() {
    Debtors.invoices(vm.selected.debtor_uuid, { descLimit : numInvoicesDisplayed })
      .then((invoices) => {
        vm.patientInvoices = invoices;
      })
      .catch(Notify.handleError);
  }

  /**
   * @function loadAllInvoices
   */
  function loadAllInvoices() {
    Debtors.invoices(vm.selected.debtor_uuid)
      .then((invoices) => {
        vm.patientInvoices = invoices;
      })
      .catch(Notify.handleError);
  }

  /**
   * @function getInvoiceDetails
   * @param invoice
   */
  function getInvoiceDetails(invoice) {
    delete vm.invoice;
    vm.loading = true;

    const parameters = {
      invoiceUuid : invoice.uuid,
      patientUuid : vm.selected.uuid,
    };

    PatientInvoice.findConsumableInvoicePatient(parameters)
      .then(consumableInvoice => {
        vm.invoice = consumableInvoice;
      })
      .catch(Notify.handleError)
      .finally(() => { vm.loading = false });
  }

  /**
   * @function setInvoice
   * @param invoice
   */
  function setInvoice(invoice) {
    vm.invoice = invoice;
  }

  /**
   * @function openBarcodeScanner
   * @description
   * Opens the barcode scanner component and receives the invoice from the
   * modal.  Sets both the patient and the invoice based on the scan.
   */
  function openBarcodeScanner() {
    let invoice;
    vm.loading = true;

    Barcodes.modal()
      .then(record => {
        invoice = record;
        return Patients.read(record.patient_uuid);
      })
      .then(patient => {
        setPatient(patient);

        // we need to wait for the bh-find-invoice component to call the setInvoice()
        // since the invoice details have to be formatted in a particular way.
        vm.scannedInvoice = invoice;
      })
      .catch(angular.noop)
      .finally(() => { vm.loading = false; });
  }

  /**
   * @function submit
   */
  function submit() {
    vm.selected.invoice = vm.invoice;
    Instance.close(vm.selected);
  }

}
