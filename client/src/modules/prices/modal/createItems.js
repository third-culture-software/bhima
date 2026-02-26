angular.module('bhima.controllers')
  .controller('PriceListItemsModalController', PriceListItemsModalController);

PriceListItemsModalController.$inject = [
  'data', '$uibModalInstance', 'InventoryService', 'util', 'NotifyService',
  'appcache', 'PriceListService', 'ModalService',
];

/**
 *
 * @param data
 * @param Instance
 * @param Inventory
 * @param util
 * @param Notify
 * @param AppCache
 * @param PriceList
 * @param Modal
 */
function PriceListItemsModalController(
  data, Instance, Inventory, util,
  Notify, AppCache, PriceList, Modal,
) {
  const vm = this;

  // bind variables
  vm.length250 = util.length250;
  vm.action = null;

  vm.isValidItem = isValidItem;
  vm.pricelist = data;

  // bind methods
  vm.submit = submit;
  vm.cancel = cancel;
  // remove a price list item
  vm.remove = remove;

  const inventoryMap = {};

  /**
   *
   */
  function startUp() {
    init();
    Inventory.read(null, { skipTags : true })
      .then((inventory) => {
        // gather all used uuids in a flat array
        inventory.forEach(item => {
          inventoryMap[item.uuid] = item;
        });

        vm.inventories = inventory;
        // load price list item
        refreshList();
      })
      .catch(Notify.handleError);
  }

  // initialize the price list item object (vm.data)
  /**
   *
   * @param form
   */
  function init(form) {
    vm.data = {
      is_percentage : 0,
      price_list_uuid : vm.pricelist.uuid,
    };

    if (form) {
      form.$setPristine();
      form.$setUntouched();
    }
  }

  // load price list items
  /**
   *
   */
  function refreshList() {

    const labelInventory = (item) => {
      const row = angular.copy(item);
      row.inventory_label = inventoryMap[row.inventory_uuid].label;
      return row;
    };

    PriceList.details(vm.pricelist.uuid)
      .then(pricelist => {
        vm.pricelist = pricelist;
        vm.gridOptions.data = pricelist.items.map(labelInventory);
      });
  }

  // ui-grid coloumn
  const columns = [{
    field : 'label',
    displayName : 'FORM.LABELS.LABEL',
    headerCellFilter : 'translate',
  }, {
    field : 'inventory_label',
    displayName : 'FORM.LABELS.INVENTORY',
    headerCellFilter : 'translate',
  }, {
    field : 'value',
    displayName : 'FORM.LABELS.VALUE',
    headerCellFilter : 'translate',
    cellTemplate : `/modules/prices/templates/price_item_value.tmpl.html`,
    type : 'number',
    width : 70,
  }, {
    field : 'actions',
    width : 25,
    displayName : '',
    cellTemplate : `/modules/prices/templates/delete_price_item.tmpl.html`,
  }];

  vm.gridOptions = {
    appScopeProvider : vm,
    enableColumnMenus : false,
    columnDefs : columns,
    enableSorting : true,
    fastWatch : true,
    flatEntityAccess : true,
  };

  vm.gridOptions.onRegisterApi = gridApi => {
    vm.gridApi = gridApi;
  };

  // check if the price list item is valid
  /**
   *
   */
  function isValidItem() {
    const hasNegativePrice = (!vm.data.is_percentage && vm.data.value < 0);

    if (hasNegativePrice) {
      vm.error = 'PRICE_LIST.ERRORS.HAS_NEGATIVE_PRICE';
      Notify.danger(vm.error);
    }

    return !hasNegativePrice;
  }

  // submitting add price list item form
  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) { return; }

    // make sure that there are no negative prices
    if (!isValidItem()) {
      return;
    }

    PriceList.createItem(vm.data)
      .then(() => {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
        init(form);
        refreshList();
      })
      .catch(Notify.handleError);
  }

  // close the modal
  /**
   *
   */
  function cancel() {
    Instance.close();
  }

  // switch to delete warning mode
  /**
   *
   * @param uuid
   */
  function remove(uuid) {
    Modal.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(bool => {
        // if the user clicked cancel then return
        if (!bool) {
          return;
        }
        // if we get there, the user wants to delete a priceList item
        PriceList.deleteItem(uuid)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            refreshList();
          })
          .catch(Notify.handleError);
      });
  }

  startUp();
}
