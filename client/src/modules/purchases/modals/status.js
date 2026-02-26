angular.module('bhima.controllers')
  .controller('PurchaseOrderStatusModalController', PurchaseOrderStatusModalController);

PurchaseOrderStatusModalController.$inject = [
  '$uibModalInstance', 'NotifyService', 'PurchaseOrderService', 'data', 'bhConstants',
];

/**
 *
 * @param Instance
 * @param Notify
 * @param PurchaseOrder
 * @param Data
 * @param Constants
 */
function PurchaseOrderStatusModalController(Instance, Notify, PurchaseOrder, Data, Constants) {
  const vm = this;

  const isStoredCheck = [
    Constants.purchase.RECEIVED,
    Constants.purchase.PARTIALLY_RECEIVED,
    Constants.purchase.EXCESSIVE_RECEIVED_QUANTITY,
  ];

  // global variables
  vm.purchase = Data;

  // expose to view
  vm.close = Instance.close;
  vm.submit = submit;

  vm.isStored = isStoredCheck.includes(vm.purchase.status_id);

  // submit the choice
  /**
   *
   */
  function submit() {
    const data = { status_id : vm.status };

    return PurchaseOrder.update(vm.purchase.uuid, data)
      .then(() => {
        Instance.close(true);
      })
      .catch(Notify.handleError);
  }

}
