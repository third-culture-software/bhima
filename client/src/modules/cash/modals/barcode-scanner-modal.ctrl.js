angular.module('bhima.controllers')
  .controller('CashBarcodeScannerModalController', CashBarcodeController);

CashBarcodeController.$inject = [
  'NotifyService', 'PatientService', 'PatientInvoiceService',
  '$uibModalInstance', '$rootScope',
];

/**
 * @param Notify
 * @param Patients
 * @param Invoices
 * @param ModalInstance
 * @param RootScope
 * @module cash/modals/CashBarController
 * @description
 * This controller is responsible for scanning barcodes and the
 * configuring the CashForm with the barcode
 */
function CashBarcodeController(Notify, Patients, Invoices, ModalInstance, RootScope) {
  const vm = this;

  // bind methods to template scope
  vm.dismiss = () => ModalInstance.dismiss();
  vm.onScanCallback = onScanCallback;

  // fetch detailed information about the invoice and the patient, based on the
  // scanned barcode details
  /**
   *
   * @param invoice
   */
  function onScanCallback(invoice) {
    const formattedInvoiceDetails = {
      description : invoice.serviceName,
    };

    // fetch the remaining balance on this invocie
    return Invoices.balance(invoice.uuid)
      .then(invoiceBalanceDetails => {
        // cash module expects an array (list) of invoices and their balances
        formattedInvoiceDetails.invoices = [invoiceBalanceDetails];

        // fetch detailed information on the relevant patient
        return Patients.read(null, { debtor_uuid : invoice.debtor_uuid });
      })
      .then(patients => {
        const [patient] = patients;
        formattedInvoiceDetails.patient = patient;

        // emit the collected information to the main Cash Module Controller and
        // exit the modal
        // this message is parsed by the cash controller
        RootScope.$broadcast('cash:configure', formattedInvoiceDetails);
        ModalInstance.close();
      })
      .catch(Notify.handleError);
  }
}
