const bhStockReceiptTemplate = `
  <a ng-click="$ctrl.open()" href="" translate>
    {{ $ctrl.displayValue }}
  </a>`;

angular.module('bhima.components')
  .component('bhStockReceipt', {
    template : bhStockReceiptTemplate,
    controller  : bhStockReceiptController,
    bindings    : {
      value : '<',
      displayValue : '<',
      fluxId : '<',
    },
  });

bhStockReceiptController.$inject = ['ReceiptModal', '$log'];

/**
 *
 * @param ReceiptModal
 * @param $log
 */
function bhStockReceiptController(ReceiptModal, $log) {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    // make sure the receipt type exists before it is clicked
    const hasCallbackFn = ReceiptModal.getReceiptFnByFluxId($ctrl.fluxId);

    if (!hasCallbackFn) {
      $log.error(`Warning: Cannot find a stock receipt for flux ${$ctrl.fluxId} in ReceiptModalService!`);
    }
  };

  $ctrl.open = () => ReceiptModal.getReceiptFnByFluxId($ctrl.fluxId)($ctrl.value);
}
