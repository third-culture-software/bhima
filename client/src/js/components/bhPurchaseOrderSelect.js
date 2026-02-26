angular.module('bhima.components')
  .component('bhPurchaseOrderSelect', {
    templateUrl : 'modules/templates/bhPurchaseOrderSelect.tmpl.html',
    controller  : PurchaseOrderComponentsController,
    transclude  : true,
    bindings    : {
      purchaseUuid        : '<',
      onSelectCallback : '&',
      required : '@?',
      label : '@?',
    },
  });

PurchaseOrderComponentsController.$inject = [
  'PurchaseOrderService', 'NotifyService',
];

/**
 * Purchase Order Component Controller
 * @param PurchaseOrder
 * @param Notify
 */
function PurchaseOrderComponentsController(PurchaseOrder, Notify) {
  const $ctrl = this;
  $ctrl.label = $ctrl.label || 'FORM.LABELS.PURCHASE_ORDER';

  $ctrl.$onInit = function onInit() {
    $ctrl.required = $ctrl.required || false;

    PurchaseOrder.search()
      .then((purchases) => {

        $ctrl.purchases = purchases;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = $item => $ctrl.onSelectCallback({ purchase : $item });
}
