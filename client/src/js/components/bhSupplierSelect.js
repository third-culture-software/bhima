angular.module('bhima.components')
  .component('bhSupplierSelect', {
    templateUrl : 'modules/templates/bhSupplierSelect.tmpl.html',
    controller  : SupplierSelectController,
    transclude  : true,
    bindings    : {
      supplierUuid     : '<',
      onSelectCallback : '&',
      label            : '@?',
    },
  });

SupplierSelectController.$inject = [
  'SupplierService', 'NotifyService',
];

/**
 * Supplier selection component
 * @param Suppliers
 * @param Notify
 */
function SupplierSelectController(Suppliers, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    // default for label
    $ctrl.label = $ctrl.label || 'FORM.LABELS.SUPPLIER';

    // load all Suppliers
    Suppliers.read()
      .then(suppliers => {
        $ctrl.suppliers = suppliers;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = supplier => {
    $ctrl.onSelectCallback({ supplier });
  };
}
