angular.module('bhima.controllers')
  .controller('VoucherScanBarcodeController', VoucherScanBarcodeController);

VoucherScanBarcodeController.$inject = [
  'BarcodeService', 'PatientService', 'DebtorGroupService', 'bhConstants',
  '$uibModalInstance', '$timeout', 'PatientInvoiceService', '$rootScope',
  '$translate',
];

/**
 * @param Barcodes
 * @param Patients
 * @param DebtorGroups
 * @param bhConstants
 * @param Instance
 * @param $timeout
 * @param Invoices
 * @param RS
 * @param $translate
 * @module voucher/modals/VoucherScanBarcodeController
 * @description
 * This is almost a direct copy of the cash scan barcode controller with some
 * bells and whistles removed.
 * @todo - refactor this whole thing into a component.
 */
function VoucherScanBarcodeController(
  Barcodes, Patients, DebtorGroups, bhConstants, Instance, $timeout, Invoices,
  RS, $translate,
) {
  const vm = this;

  const MODAL_CLOSE_TIMEOUT = 0;

  vm.onScanCallback = onScanCallback;
  vm.dismiss = dismiss;

  /**
   *
   */
  function dismiss() {
    Instance.dismiss();
  }

  /**
   * @param record
   * @function onScanCallback
   * @description
   * This function searches for the invoice details after the value is read from
   * the barcode.  It closes the modal at the end of its activities.
   */
  function onScanCallback(record) {
    vm.invoice = record;
    Invoices.balance(record.uuid)
      .then(balance => {
        vm.balance = balance;
        return Patients.read(null, { debtor_uuid : vm.invoice.debtor_uuid });
      })
      .then((patients) => {

        // de-structure search array
        const [patient] = patients;
        vm.patient = patient;

        return DebtorGroups.read(patient.debtor_group_uuid);
      })
      .then((group) => {

        // TODO - move all data gathering to a barcode component
        const data = {
          patient : vm.patient,
          invoice : vm.invoice,
          balance : vm.balance,
          group,
        };

        // format the data as needed before returning to the parent controller
        const fmt = barcodeDataFinalizerFn(data);

        // emit the configuration event
        RS.$broadcast('voucher:configure', fmt);

        // close the modal after a timeout
        $timeout(() => Instance.close(), MODAL_CLOSE_TIMEOUT, false);
      });
  }

  // this function formats the data as needed.
  /**
   *
   * @param data
   */
  function barcodeDataFinalizerFn(data) {
    data.description = $translate.instant('VOUCHERS.TYPES.SUPPORT_PAYMENT_DESCRIPTION', {
      patientName : data.patient.display_name,
      patientReference : data.patient.reference,
      invoiceReference : data.invoice.reference,
    });

    data.debit = {
      debit : data.invoice.cost,
    };

    // PRISE_EN_CHARGE
    data.type_id = bhConstants.transactionType.SUPPORT_INCOME;

    data.credit = {
      account_id : data.group.account_id,
      document : data.invoice,
      entity : { uuid : data.patient.debtor_uuid },
      credit : data.invoice.cost,
    };

    data.amount = data.invoice.cost;

    return data;
  }
}
