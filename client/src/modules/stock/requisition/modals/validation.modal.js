angular.module('bhima.controllers')
  .controller('ValidationRequisitionModalController', ValidationRequisitionModalController);

// dependencies injections
ValidationRequisitionModalController.$inject = [
  'Store', 'InventoryService', 'NotifyService',
  '$uibModalInstance', 'StockService', 'ReceiptModal', 'data',
];

/**
 *
 * @param Store
 * @param Inventories
 * @param Notify
 * @param Modal
 * @param Stock
 * @param Receipts
 * @param data
 */
function ValidationRequisitionModalController(
  Store, Inventories, Notify, Modal, Stock, Receipts, data,
) {

  const vm = this;
  vm.isCreateState = true;
  vm.requistionReference = '';

  const store = new Store({ data : [] });
  const columns = [
    {
      field : 'available',
      displayName : '',
      width : 25,
      cellTemplate : 'modules/stock/requisition/templates/available.cell.html',
    },
    {
      field : 'inventory_uuid',
      displayName : 'FORM.LABELS.CODE',
      headerCellFilter : 'translate',
      width : 50,
      cellTemplate : 'modules/stock/requisition/templates/inventory.cell.html',
    },

    {
      field : 'description',
      displayName : 'TABLE.COLUMNS.DESCRIPTION',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/requisition/templates/description.cell.html',
    },

    {
      field : 'quantity',
      displayName : 'FORM.LABELS.QUANTITY',
      headerCellFilter : 'translate',
      width : 95,
      cellTemplate : 'modules/stock/requisition/templates/old_quantity.cell.html',
      type : 'number',
    },

    {
      field : 'quantity_validated',
      displayName : 'FORM.LABELS.QUANTITY_VALIDATED',
      headerCellFilter : 'translate',
      width : 135,
      cellTemplate : 'modules/stock/requisition/templates/quantity.cell.html',
      type : 'number',
    },
  ];

  vm.gridOptions = {
    appScopeProvider : vm,
    enableColumnMenus : false,
    columnDefs : columns,
    enableSorting : true,
    fastWatch : true,
    flatEntityAccess : true,
  };

  vm.model = { date : new Date() };

  vm.addItem = addItem;
  vm.removeItem = removeItem;
  vm.configureItem = configureItem;
  vm.autoSuggestInventories = autoSuggestInventories;
  vm.cancel = cancel;
  vm.checkInventoryAvailability = checkInventoryAvailability;

  vm.onSelectDepot = depot => {
    vm.model.depot_uuid = depot.uuid;

    loadAvailableInventories()
      .then(values => {
        vm.supplierInventoriesQuantities = values.supplierInventoriesQuantities;
        vm.availableSupplierInventories = values.availableSupplierInventories;
        handleAvailability();
      })
      .catch(Notify.handleError);
  };

  vm.onDateChange = date => {
    vm.model.date = date;
  };

  vm.onSelectRequestor = requestor => {
    const DEPOT_REQUESTOR_TYPE = 2;
    vm.model.requestor_type_id = requestor.requestor_type_id;
    vm.model.requestor_uuid = requestor.uuid;
    // enable auto suggestions only if a depot is selected
    vm.enableAutoSuggest = (requestor.requestor_type_id === DEPOT_REQUESTOR_TYPE && requestor.uuid);

    // Cancel the supplier depot selection if the user changes the requesting depot
    vm.model.depot_uuid = [];
  };

  if (data.uuid) {
    vm.requisitionUuid = data.uuid;
    vm.isCreateState = false;

    Stock.stockRequisition.read(data.uuid)
      .then((requisionData) => {
        requisionData.items.forEach((item, index) => {
          item.old_quantity = item.quantity;

          addItem(1, {
            _initialised : true,
            id : index,
            inventory_uuid : item.inventory_uuid,
            code : item.code,
            S_Q : item.quantity,
            old_quantity : item.old_quantity,
            quantity : item.quantity,
            inventory_label : item.text,
            uuid : item.inventory_uuid,
          });
        });

        vm.model = requisionData;
        vm.model.date = new Date(vm.model.date);
      })
      .catch(Notify.handleError);
  }

  vm.submit = form => {
    if (form.$invalid) { return null; }

    const items = store.data.map(getItem);
    if (!items.length) { return null; }

    angular.extend(vm.model, { items });

    const updateElement = {
      date : new Date(vm.model.date),
      depot_uuid : vm.model.depot_uuid,
      description : vm.model.description,
      items : vm.model.items,
      project_id : vm.model.project_id,
      requestor_type_id : vm.model.requestor_type_id,
      requestor_uuid : vm.model.requestor_uuid,
      user_id : vm.model.user_id,
      isValidation : true,
    };

    return Stock.stockRequisition.update(vm.requisitionUuid, updateElement)
      .then(res => {
        Receipts.stockRequisitionReceipt(res.uuid, true);
        Modal.close(true);
      })
      .catch(Notify.handleError);
  };

  /**
   *
   */
  function autoSuggestInventories() {
    if (!vm.enableAutoSuggest) { return; }

    toggleLoadingSuggest();

    Stock.inventories.read(null, { depot_uuid : vm.model.requestor_uuid })
      .then(clearAndFillGrid)
      .catch(Notify.handleError)
      .finally(toggleLoadingSuggest);
  }

  /**
   *
   */
  function loadAvailableInventories() {
    if (!vm.model.depot_uuid) { return {}; }

    return Stock.inventories.read(null, {
      depot_uuid : vm.model.depot_uuid,
      includeEmptyLot : 0,
      consumable : 1,
    })
      .then(inventories => {
        vm.supplierInventoriesQuantities = new Map(inventories.map(i => ([i.inventory_uuid, i.quantity])));
        vm.availableSupplierInventories = inventories.map(i => i.inventory_uuid);
        return {
          supplierInventoriesQuantities : vm.supplierInventoriesQuantities,
          availableSupplierInventories : vm.availableSupplierInventories,
        };
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param inventory
   * @param currentQuantity
   */
  function checkInventoryAvailability(inventory, currentQuantity) {
    if (vm.model.depot_uuid) {
      if (currentQuantity) {
        inventory.quantity = currentQuantity;
      }

      const identifier = inventory.inventory_uuid ? inventory.inventory_uuid : inventory.uuid;
      const quantity = inventory.inventory_uuid ? inventory.S_Q : inventory.quantity;

      inventory.isAvailable = vm.availableSupplierInventories && !!vm.availableSupplierInventories.includes(identifier);

      if (inventory.isAvailable) {
        inventory.hasEnoughQuantity = !!(vm.supplierInventoriesQuantities.get(identifier) >= quantity);
        inventory.supplierAvailableQuantity = vm.supplierInventoriesQuantities.get(identifier);
      }
    }

    return inventory;
  }

  /**
   *
   */
  function handleAvailability() {
    vm.toggleAvailability = true;

    if (!vm.model.depot_uuid) { return; }

    store.data.map(i => checkInventoryAvailability(i.inventory, i.quantity));
  }

  /**
   *
   */
  function toggleLoadingSuggest() {
    vm.loadingSuggest = !vm.loadingSuggest;
  }

  /**
   *
   * @param rows
   */
  function clearAndFillGrid(rows) {
    store.clear();
    rows
      .filter(row => row.S_Q > 0)
      .forEach(row => addItem(1, row));
  }

  /**
   *
   * @param row
   */
  function getItem(row) {
    return {
      inventory_uuid : row.inventory_uuid,
      quantity : row.quantity,
      old_quantity : row.old_quantity,
    };
  }

  /**
   *
   */
  function startup() {
    // load available supplier inventories if supplier depot defined
    if (vm.model.depot_uuid) {
      loadAvailableInventories()
        .then(values => {
          vm.supplierInventoriesQuantities = values.supplierInventoriesQuantities;
          vm.availableSupplierInventories = values.availableSupplierInventories;
        })
        .catch(Notify.handleError);
    }

    if (data.depot && data.depot.uuid) {
      const DEPOT_REQUESTOR_TYPE = 2;
      const { depot } = data;

      vm.model.requestor_type_id = DEPOT_REQUESTOR_TYPE;
      vm.model.requestor_uuid = depot.uuid;
      // enable auto suggestions only if a depot is selected
      vm.enableAutoSuggest = true;
      autoSuggestInventories();
    }

    Inventories.read(null, { consumable : 1 })
      .then(rows => {
        vm.selectableInventories = rows;
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param n
   * @param item
   */
  function addItem(n, item) {
    let i = n;
    while (i--) {
      const row = { id : store.data.length };

      if (item) {
        checkInventoryAvailability(item);
        item.label = item.text;
        row._initialised = true;
        row.inventory = item;
        row.inventory_uuid = item.inventory_uuid;
        row.quantity = item.S_Q;
        row.old_quantity = row.quantity;

        if (item.inventory_label) {
          row.inventory.label = item.inventory_label;
        }
      }

      store.post(row);
    }

    vm.gridOptions.data = store.data;
  }

  /**
   *
   * @param row
   */
  function removeItem(row) {
    store.remove(row.id);
  }

  /**
   *
   * @param item
   */
  function configureItem(item) {
    item._initialised = true;
    item.inventory_uuid = item.inventory.uuid;
    item.quantity = 0;
  }

  /**
   *
   */
  function cancel() {
    Modal.dismiss();
  }

  startup();
}
