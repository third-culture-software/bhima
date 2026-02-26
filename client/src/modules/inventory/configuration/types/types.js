angular.module('bhima.controllers')
  .controller('InventoryTypesController', InventoryTypesController);

// dependencies injection
InventoryTypesController.$inject = [
  'InventoryTypeService', 'NotifyService', 'ModalService', '$translate',
];

/**
 * Inventory Type Controller
 * This controller is responsible for handling inventory type module
 * @param InventoryType
 * @param Notify
 * @param Modal
 * @param $translate
 */
function InventoryTypesController(InventoryType, Notify, Modal, $translate) {
  const vm = this;

  // expose to the view
  vm.addInventoryType = addInventoryType;
  vm.editInventoryType = editInventoryType;
  vm.deleteInventoryType = deleteInventoryType;

  // startup
  startup();

  /** add inventory type */
  function addInventoryType() {
    const request = { action : 'add' };

    Modal.openInventoryTypeActions(request)
      .then((res) => {
        if (res.id) {
          Notify.success('FORM.INFO.CREATE_SUCCESS');
        }
      })
      .then(startup)
      .catch(Notify.handleError);
  }

  /**
   * edit inventory type
   * @param id
   */
  function editInventoryType(id) {
    const request = { action : 'edit', identifier : id };

    Modal.openInventoryTypeActions(request)
      .then(() => {
        Notify.success('FORM.INFO.UPDATE_SUCCESS');
      })
      .then(startup)
      .catch(Notify.handleError);
  }

  /**
   * delete inventory type
   * @param id
   */
  function deleteInventoryType(id) {
    Modal.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then((bool) => {
        // if the user clicked cancel, reset the view and return
        if (!bool) {
          vm.view = 'default';
          return;
        }
        // if we get there, the user wants to delete
        InventoryType.delete(id)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            startup();

          })
          .catch(Notify.handleError);
      });

  }

  /** initializes the view */
  function startup() {
    // get inventory types
    InventoryType.read()
      .then((list) => {
        list.forEach(item => {
          if (item.is_predefined) {
            item.text = $translate.instant(item.text);
          }
        });

        vm.typeList = list;
      })
      .catch(Notify.handleError);
  }

}
