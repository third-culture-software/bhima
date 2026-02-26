angular.module('bhima.components')
  .component('bhHasRequisitionVoucher', {
    templateUrl : 'js/components/bhHasRequisitionVoucher/bhHasRequisitionVoucher.html',
    controller  : bhHasRequisitionVoucherController,
    bindings    : {
      message   : '<',
      classLabel : '<',
      reference : '<',
      onChange  : '&',
      requestor : '<?',
      required : '<',
    },
  });

bhHasRequisitionVoucherController.$inject = [];

/**
 *
 */
function bhHasRequisitionVoucherController() {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.requisitionVoucherExist = 0;
    $ctrl.requisitionDisabled = true;
  };

  $ctrl.$onChanges = function onChanges(changes) {
    if (changes.requestor && changes.requestor.currentValue) {
      $ctrl.requisitionVoucherExist = 0;
      $ctrl.requisitionDisabled = false;
    }

  };

  $ctrl.onChangeVoucherExist = value => {
    $ctrl.requisitionVoucherExist = value;
  };

  $ctrl.onSelectRequisition = (requisition) => {
    $ctrl.onChange({ reference : requisition.reference });
  };
}
