angular.module('bhima.controllers')
  .controller('ModalWaitingListConfirmationController', ModalWaitingListConfirmationController);

ModalWaitingListConfirmationController.$inject = [
  'data', 'SessionService', '$uibModalInstance', 'MultiplePayrollService', 'NotifyService', '$state',
];

/**
* @function ModalWaitingListConfirmationController
*
* @description
* This is just a confirmation modal for putting employees on the list to be paid.
* It will always return a successful promise.  Potentially, we should handle this using ui-state
* like in other modules.
*/
function ModalWaitingListConfirmationController(data, Session, Instance, MultiplePayroll, Notify) {
  const vm = this;

  vm.cancel = () => Instance.close(false);
  vm.submit = submit;

  vm.enterprise = Session.enterprise;
  vm.numEmployees = data.employeeUuids.length;
  vm.paymentPeriodLabel = data.paymentPeriodLabel;
  vm.totalNetSalary = data.totalNetSalary;

  function submit() {
    return MultiplePayroll.paymentCommitment(data.paymentPeriodId, data.employeeUuids)
      .then(() => {
        Notify.success('FORM.INFO.CONFIGURED_SUCCESSFULLY');
        Instance.close(true);
      });

  }

}
