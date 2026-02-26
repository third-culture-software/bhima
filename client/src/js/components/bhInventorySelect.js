angular.module('bhima.components')
  .component('bhInventorySelect', {
    templateUrl : 'modules/templates/bhInventorySelect.tmpl.html',
    controller  : InventorySelectController,
    transclude  : true,
    bindings    : {
      inventoryUuid    : '<?',
      onSelectCallback : '&',
      required         : '<?',
      onlyConsumable   : '<?',
    },
  });

InventorySelectController.$inject = [
  'InventoryService', 'NotifyService',
];

/**
 * Inventory selection component
 * @param Inventory
 * @param Notify
 */
function InventorySelectController(Inventory, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    // fired when an inventory has been selected

    const params = { skipTags : true };

    if ($ctrl.onlyConsumable) {
      Object.assign(params, { consumable : 1 });
    }

    // load all inventories
    Inventory.read(null, params)
      .then(inventories => {
        inventories.forEach(i => {
          i.hrLabel = `[${i.code}] ${i.label}`;
        });

        $ctrl.inventories = inventories;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = (inventory) => $ctrl.onSelectCallback({ inventory });
}
