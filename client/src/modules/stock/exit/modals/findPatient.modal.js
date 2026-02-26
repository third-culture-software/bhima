angular.module('bhima.controllers')
  .controller('StockFindPatientModalController', StockFindPatientModalController);

StockFindPatientModalController.$inject = [
  '$uibModalInstance', 'PatientService', 'NotifyService', 'data', 'AppCache',
  'BarcodeService', 'DebtorService', 'PatientInvoiceService', 'SessionService',
];

/**
 *
 * @param Instance
 * @param Patients
 * @param Notify
 * @param Data
 * @param AppCache
 * @param Barcodes
 * @param Debtors
 * @param PatientInvoice
 * @param Session
 */
function StockFindPatientModalController(Instance, Patients, Notify, Data, AppCache, Barcodes, Debtors,
  PatientInvoice, Session) {
  const vm = this;

  // global
  vm.selected = {};
  vm.patientInvoices = [];
  vm.loading = false;

  // bind methods
  vm.setPatient = setPatient;
  vm.setInvoice = setInvoice;
  vm.submit = submit;
  vm.cancel = cancel;
  vm.openBarcodeScanner = openBarcodeScanner;
  vm.enterprise = Session.enterprise;

  vm.findDetailInvoice = findDetailInvoice;

  if (Data.entity_uuid) {
    vm.loading = true;
    Patients.read(Data.entity_uuid)
      .then(patient => {
        return setPatient(patient);
      })
      .catch(err => {
        // do not show error if
        if (err.statusCode === 404) {
          setPatient({});
        } else {
          Notify.handleError(err);
        }
      })
      .finally(() => { vm.loading = false; });
  }

  // set patient
  /**
   *
   * @param patient
   */
  function setPatient(patient) {
    vm.selected = patient;
    return loadRecentInvoices();
  }

  /**
   *
   */
  function loadRecentInvoices() {
    // load debtor invoices
    Debtors.invoices(vm.selected.debtor_uuid, { descLimit5 : 1 })
      .then((invoices) => {
        vm.patientInvoices = invoices;
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param invoice
   */
  function findDetailInvoice(invoice) {
    const parameters = {
      invoiceUuid : invoice.uuid,
      patientUuid : vm.selected.uuid,
    };

    PatientInvoice.findConsumableInvoicePatient(parameters)
      .then(consumableInvoice => {
        vm.invoice = consumableInvoice;

      })
      .catch(Notify.handleError);

  }

  /**
   *
   * @param invoice
   */
  function setInvoice(invoice) {
    vm.invoice = invoice;
  }

  // submit
  /**
   *
   */
  function submit() {
    vm.selected.invoice = vm.invoice;
    Instance.close(vm.selected);
  }

  // cancel
  /**
   *
   */
  function cancel() {
    Instance.close();
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

}
