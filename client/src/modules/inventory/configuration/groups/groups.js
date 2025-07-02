angular.module('bhima.controllers')
  .controller('InventoryGroupsController', InventoryGroupsController);

// dependencies injection
InventoryGroupsController.$inject = [
  '$translate', 'InventoryGroupService', 'AccountService',
  'NotifyService', 'ModalService', 'Store',
];

/**
 * Inventory Group Controller ]
 * This controller is responsible for handling inventory group module
 */
function InventoryGroupsController($translate, InventoryGroup, Account, Notify, Modal, Store) {
  const vm = this;
  let AccountStore;

  /** global variables */
  vm.created = false;
  vm.updated = false;

  // expose to the view
  vm.editInventoryGroup = editInventoryGroup;
  vm.addInventoryGroup = addInventoryGroup;
  vm.deleteInventoryGroup = deleteInventoryGroup;

  // startup
  startup();

  function handler(err) {
    if (err) {
      Notify.handleError(err);
    }
  }

  /** add inventory group */
  function addInventoryGroup() {
    const request = { action : 'add' };

    Modal.openInventoryGroupActions(request)
      .then(handleCreateSuccess)
      .then(startup)
      .catch(handler);
  }

  function handleCreateSuccess(res) {
    if (!res.uuid) { return; }
    Notify.success('FORM.INFO.CREATE_SUCCESS');
  }

  /** edit inventory group */
  function editInventoryGroup(uuid) {
    const request = { action : 'edit', identifier : uuid };

    Modal.openInventoryGroupActions(request)
      .then(handleUpdateSuccess)
      .then(startup)
      .catch(handler);
  }

  function handleUpdateSuccess(res) {
    if (!res.uuid) { return; }
    Notify.success('FORM.INFO.CREATE_SUCCESS');
  }

  /** delete inventory group */
  function deleteInventoryGroup(id) {
    function handleDeleteSuccess() {
      Notify.success('FORM.INFO.DELETE_SUCCESS');
      startup();
      return null;
    }

    function handleConfirmDelete(bool) {
      // if the user clicked cancel, reset the view and return
      if (!bool) {
        vm.view = 'default';
        return null;
      }
      // if we get there, the user wants to delete
      return InventoryGroup.remove(id)
        .then(handleDeleteSuccess);
    }

    Modal.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(handleConfirmDelete)
      .catch(Notify.handleError);
  }

  function startup() {
    // initializes inventory group list with associate accounts
    Account.read()
      .then(handleAccountList)
      .then(readInventoryGroup)
      .then(handleGroupList)
      .catch(Notify.handleError);

    // handle the list of accounts
    function handleAccountList(list) {
      vm.accountList = list;
      AccountStore = new Store({ id : 'id', data : list });
    }

    // handle the list of group
    function handleGroupList(list) {
      function setAccountNumber(group) {
        // stock account
        group.stockAccountNumber = AccountStore.get(group.stock_account)
          ? AccountStore.get(group.stock_account).number : '';

        // sales account
        group.saleAccountNumber = AccountStore.get(group.sales_account)
          ? AccountStore.get(group.sales_account).number : '';

        // charge account
        group.cogsAccountNumber = AccountStore.get(group.cogs_account)
          ? AccountStore.get(group.cogs_account).number : '';
      }

      list.forEach(setAccountNumber);

      vm.groupList = list;

      return list;
    }

    function readInventoryGroup() {
      return InventoryGroup.read(null, { include_members : 1 });
    }
  }
}
