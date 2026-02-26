angular.module('bhima.components')
  .component('bhRequisitionSelect', {
    templateUrl : 'modules/templates/bhRequisitionSelect.tmpl.html',
    controller  : RequisitionSelectController,
    transclude  : true,
    bindings    : {
      requisitionUuid : '<',
      requestorUuid : '<?',
      onSelectCallback : '&',
      disallowCompleted : '@?',
      required : '@?',
      label : '@?',
      disabled : '<?',
    },
  });

RequisitionSelectController.$inject = [
  'StockService', 'NotifyService', 'bhConstants',
];

/**
 * Requisition Select Controller
 * @param Stock
 * @param Notify
 * @param bhConstants
 */
function RequisitionSelectController(Stock, Notify, bhConstants) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.label = $ctrl.label || 'FORM.LABELS.REQUISITION_REFERENCE';
    $ctrl.required = $ctrl.required || false;
    $ctrl.disallowCompleted = $ctrl.disallowCompleted || false;

    const params = {};
    params.requestor_uuid = $ctrl.requestorUuid;

    $ctrl.disallowCompleted = false;

    Stock.stockRequisition.read(null, params)
      .then((requisitions) => {
        const COMPLETED = bhConstants.stockRequisition.completed_status;
        $ctrl.requisitions = $ctrl.disallowCompleted
          ? requisitions.filter(req => req.status_id !== COMPLETED) : requisitions;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = ($item) => {
    $ctrl.onSelectCallback({ requisition : $item });
  };
}
