angular.module('bhima.components')
  .component('bhPurchaseStatusSelect', {
    templateUrl : 'modules/templates/bhPurchaseStatusSelect.tmpl.html',
    controller  : PurchaseStatusSelectController,
    bindings    : {
      onChange : '&',
      statusId : '<?',
      label : '@?',
      required : '<?',
    },
  });

PurchaseStatusSelectController.$inject = [
  'PurchaseOrderService', 'NotifyService', '$translate',
];

/**
 * purchase status Selection Component
 * @param PurchaseOrder
 * @param Notify
 * @param $translate
 */
function PurchaseStatusSelectController(PurchaseOrder, Notify, $translate) {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    // label to display
    $ctrl.label = $ctrl.label || 'FORM.LABELS.STATUS';

    // init the model
    $ctrl.selectedPurchaseStatus = $ctrl.statusId || [];

    // load all Purchase status
    PurchaseOrder.purchaseState()
      .then(statuses => {
        statuses.forEach((item) => {
          item.plainText = $translate.instant(item.text);
        });

        statuses.sort((a, b) => a.plainText > b.plainText);

        $ctrl.purchaseStatus = statuses;
      })
      .catch(Notify.handleError);
  };

  $ctrl.handleChange = purchaseStatus => $ctrl.onChange({ purchaseStatus });
}
