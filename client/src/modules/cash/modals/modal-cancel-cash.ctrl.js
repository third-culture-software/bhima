angular.module('bhima.controllers')
  .controller('ModalCancelCashController', ModalCancelCashController);

ModalCancelCashController.$inject = [
  '$filter', '$state', '$uibModalInstance', 'bhConstants',
  'CashService', 'data', 'VoucherService', 'NotifyService',
];

/**
 *
 * @param $filter
 * @param $state
 * @param Instance
 * @param Constants
 * @param Cash
 * @param data
 * @param Vouchers
 * @param Notify
 */
function ModalCancelCashController($filter, $state, Instance, Constants, Cash, data, Vouchers, Notify) {
  const vm = this;

  vm.Constants = Constants;

  vm.cancelCash = {};
  vm.submit = submit;
  vm.goToPatientLink = goToPatientLink;
  const $currency = $filter('currency');

  vm.cancel = () => Instance.close(false);

  vm.cancelCash.uuid = data.cash.uuid;

  Cash.read(data.cash.uuid)
    .then(response => {
      vm.payment = response;

      vm.payment.patientName = data.cash.patientName;
      vm.payment.patientReference = data.cash.patientReference;
      vm.payment.cashbox_label = data.cash.cashbox_label;

      vm.alertI18nValues = {
        cashReference : vm.payment.reference,
        patientName : vm.payment.patientName,
        patientReference : vm.payment.patientReference,
        cost : $currency(vm.payment.amount, vm.payment.currency_id),
      };
    })
    .catch(Notify.handleError);

  /**
   *
   * @param form
   */
  function submit(form) {
    // stop submission if the form is invalid
    if (form.$invalid) {
      return false;
    }

    return Vouchers.reverse(vm.cancelCash)
      .then(() => Instance.close(true))
      .catch(Notify.handleError)
      .finally(() => Instance.close());
  }

  // Link to the patient registry
  /**
   *
   */
  function goToPatientLink() {
    Instance.close(false);
    $state.go('patientRegistry', {
      filters : [{
        key : 'debtor_uuid',
        value : vm.payment.debtor_uuid,
        displayValue : vm.payment.debtorName,
      }],
    });
  }
}
