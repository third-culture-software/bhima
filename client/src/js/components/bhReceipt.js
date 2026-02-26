const bhReceiptTemplate = `
  <a ng-click="$ctrl.open()" href="" translate>
    {{ $ctrl.displayValue }}
  </a>`;

angular.module('bhima.components')
  .component('bhReceipt', {
    template : bhReceiptTemplate,
    controller  : bhReceiptController,
    bindings    : {
      value : '<',
      type : '@',
      displayValue : '<',
    },
  });

bhReceiptController.$inject = ['ReceiptModal', '$log'];

/**
 *
 * @param ReceiptModal
 * @param $log
 */
function bhReceiptController(ReceiptModal, $log) {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    // make sure the receipt type exists before it is clicked
    const hasCallbackFn = ReceiptModal[$ctrl.type];
    if (!hasCallbackFn) {
      $log.error(`Warning: Cannot find ${$ctrl.type} in ReceiptModalService!`);
    }
  };

  $ctrl.open = () => ReceiptModal[$ctrl.type]($ctrl.value);
}
