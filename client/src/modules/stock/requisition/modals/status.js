angular.module('bhima.controllers')
  .controller('RequisitionStatusModalController', RequisitionStatusModalController);

RequisitionStatusModalController.$inject = [
  '$uibModalInstance', 'NotifyService', 'ModalService', 'StockService', 'bhConstants', 'data',
];

/**
 *
 * @param Instance
 * @param Notify
 * @param Modal
 * @param Stock
 * @param bhConstants
 * @param Data
 */
function RequisitionStatusModalController(Instance, Notify, Modal, Stock, bhConstants, Data) {
  const vm = this;

  const COMPLETED = bhConstants.stockRequisition.completed_status;

  // global variables
  vm.requisition = Data;

  // expose to view
  vm.close = Instance.close;
  vm.submit = submit;

  // submit the choice
  /**
   *
   */
  function submit() {
    const data = { status_id : vm.status };

    // If we are marking the requisition as complete, verify first
    if (Number(vm.status) === COMPLETED) {
      Modal.confirm('FORM.DIALOGS.CONFIRM_MARKING_REQUISITION_COMPLETE')
        .then((ans) => {
          if (!ans) { return 0; }
          return Stock.stockRequisition.update(vm.requisition.uuid, data);
        })
        .then(() => {
          Instance.close(); // This closes the confirm dialog
        })
        .finally(() => {
          vm.close();
        })
        .catch(Notify.handleError);
    } else {
      Stock.stockRequisition.update(vm.requisition.uuid, data)
        .then(() => {
          Instance.close();
        })
        .catch(Notify.handleError);
    }
  }

}
