angular.module('bhima.controllers')
  .controller('InventoryUnitsController', InventoryUnitsController);

// dependencies injection
InventoryUnitsController.$inject = [
  'InventoryUnitService', 'NotifyService', 'ModalService',
];

/**
 * Inventory Unit Controller
 * This controller is responsible for handling inventory unit module
 * @param InventoryUnit
 * @param Notify
 * @param Modal
 */
function InventoryUnitsController(InventoryUnit, Notify, Modal) {
  const vm = this;

  // expose to the view
  vm.addInventoryUnit = addInventoryUnit;
  vm.editInventoryUnit = editInventoryUnit;
  vm.deleteInventoryUnit = deleteInventoryUnit;

  // startup
  startup();

  /** add inventory unit */
  function addInventoryUnit() {
    const request = { action : 'add' };

    Modal.openInventoryUnitActions(request)
      .then((res) => {

        // if an id is returned, show the success create message
        if (res.id) {
          Notify.success('FORM.INFO.CREATE_SUCCESS');
        }
      })
      .then(startup)
      .catch(Notify.handleError);
  }

  /**
   * edit inventory unit
   * @param id
   */
  function editInventoryUnit(id) {
    const request = { action : 'edit', identifier : id };

    Modal.openInventoryUnitActions(request)
      .then((res) => {
        if (res) {
          Notify.success('FORM.INFO.UPDATE_SUCCESS');
        } else {
          Notify.danger('INVENTORY.CANNOT_UPDATE_PREDEFINED_UNIT', 6000);
        }
      })
      .then(startup)
      .catch(Notify.handleError);
  }

  /**
   * delete inventory unit
   * @param id
   */
  function deleteInventoryUnit(id) {
    Modal.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then((bool) => {
        // if the user clicked cancel, reset the view and return
        if (!bool) {
          vm.view = 'default';
          return;
        }
        // if we get there, the user wants to delete
        InventoryUnit.delete(id)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            startup();
          })
          .catch((error) => {
            const { data } = error;
            if (data.code === 'ERRORS.FORBIDDEN') {
              Notify.danger('INVENTORY.CANNOT_DELETE_PREDEFINED_UNIT', 6000);
            } else {
              return error;
            }
            return null;
          })
          .catch(Notify.handleError);
      });

  }

  /** initializes the view */
  function startup() {
    // get inventory units
    InventoryUnit.getUnits()
      .then((list) => {
        vm.unitList = list;
      })
      .catch(Notify.handleError);
  }
}
