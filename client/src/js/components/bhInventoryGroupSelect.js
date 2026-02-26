angular.module('bhima.components')
  .component('bhInventoryGroupSelect', {
    templateUrl : 'modules/templates/bhInventoryGroupSelect.tmpl.html',
    controller  : InventoryGroupSelectController,
    transclude  : true,
    bindings    : {
      groupUuid        : '<',
      onSelectCallback : '&',
    },
  });

InventoryGroupSelectController.$inject = [
  'InventoryService', 'NotifyService',
];

/**
 * Inventory Group Select Controller
 * @param Inventory
 * @param Notify
 */
function InventoryGroupSelectController(Inventory, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    Inventory.Groups.read()
      .then((inventoryGroups) => {
        $ctrl.inventoryGroups = inventoryGroups;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = ($item) => {
    $ctrl.onSelectCallback({ group : $item });
  };
}
