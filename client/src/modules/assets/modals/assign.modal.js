angular.module('bhima.controllers')
  .controller('AssetAssignmentModalController', AssetAssignmentModalController);

// dependencies injections
AssetAssignmentModalController.$inject = [
  'appcache', '$state', 'data', '$uibModalInstance', 'ModalService',
  'BarcodeService', 'NotifyService', 'ReceiptModal', 'StockService', 'util',
];

/**
 *
 * @param AppCache
 * @param $state
 * @param data
 * @param Modal
 * @param ModalService
 * @param Barcode
 * @param Notify
 * @param Receipts
 * @param Stock
 * @param Util
 */
function AssetAssignmentModalController(
  AppCache, $state, data, Modal, ModalService,
  Barcode, Notify, Receipts, Stock, Util) {
  const vm = this;
  const cache = AppCache('stock-assign-modal');

  // global variables
  vm.model = {
    lot_uuid : data.uuid,
    quantity : 1,
  };
  vm.isAsset = true;
  vm.maxQuantity = 1;

  vm.selectedInventory = null;
  vm.availableInventories = [];
  vm.availableLots = [];
  vm.stateParams = {};
  vm.loading = false;

  cache.stateParams = $state.params;
  vm.stateParams = cache.stateParams;

  if ($state.params.uuid || $state.params.creating) {
    cache.stateParams = $state.params;
    vm.stateParams = cache.stateParams;
  } else {
    vm.stateParams = cache.stateParams;
  }

  vm.onSelectDepot = onSelectDepot;
  /**
   *
   * @param depot
   */
  function onSelectDepot(depot) {
    vm.model.depot_uuid = depot.uuid;
    vm.inventory_uuid = null;

    vm.model.lot_uuid = null;
    vm.isAsset = 1;
    vm.model.quantity = 1;
    vm.maxQuantity = 1;

    loadAvailableInventories(depot.uuid);
  }

  vm.onSelectInventory = onSelectInventory;
  /**
   *
   * @param inventory
   */
  function onSelectInventory(inventory) {
    vm.model.lot_uuid = null;
    vm.model.quantity = 1;

    vm.availableLots = vm.globalAvailableLots
      .filter(item => item.inventory_uuid === inventory.inventory_uuid)
      .filter(item => item.is_asset || !item.expired);

    if (data.uuid) {
      // If invoked via the action menu, the use the lot uuid to find the lot
      const lot = vm.availableLots.find(elt => elt.uuid === data.uuid);
      if (lot) {
        vm.model.lot_uuid = lot.uuid;
        vm.isAsset = lot.is_asset;
        vm.model.quantity = lot.quantity;
        vm.maxQuantityLot = lot.quantity;
      }
    } else if (vm.availableLots.length === 1) {
      // If only one lot is available for this inventory, select it
      vm.model.lot_uuid = vm.availableLots[0].uuid;
      vm.isAsset = vm.availableLots[0].is_asset;
      vm.model.quantity = vm.availableLots[0].quantity;
      vm.maxQuantityLot = vm.availableLots[0].quantity;
    }
  }

  vm.assignByBarcode = function assignByBarcode() {
    Barcode.modal({ shouldSearch : false, title : 'ASSET.SCAN_ASSET_BARCODE' })
      .then(record => {
        Stock.lots.read(null, { barcode : record.uuid })
          .then(lots => {
            if (lots.length > 0) {
              const lot = lots[0];
              vm.model.depot_uuid = lot.depot_uuid;
              loadAvailableInventories(lot.depot_uuid)
                .then(() => {
                  const lotFound = vm.availableInventories.find(elt => elt.uuid === lot.uuid);
                  if (lotFound) {
                    vm.selectedInventory = lotFound;
                    vm.inventory_uuid = lot.inventory_uuid;
                    onSelectInventory(vm.selectedInventory);
                    vm.model.lot_uuid = lot.uuid;
                    onSelectLot(lot);
                  } else {
                    // If the lot has already been assigned, warn the user that
                    // it must be unassigned first.
                    ModalService.alert('ASSET.WARN_ALREADY_ASSIGNED');
                  }
                });
            }
          });
      });
  };

  vm.onSelectEntity = onSelectEntity;
  /**
   *
   * @param entity
   */
  function onSelectEntity(entity) {
    vm.model.entity_uuid = entity.uuid;
  }

  vm.onSelectLot = onSelectLot;
  /**
   *
   * @param lot
   */
  function onSelectLot(lot) {
    vm.model.quantity = lot.quantity;
    vm.maxQuantityLot = lot.quantity;
    vm.isAsset = lot.is_asset;
  }

  vm.cancel = Modal.close;

  vm.submit = form => {
    if (form.$invalid) { return; }

    const record = Util.filterFormElements(form, true);

    // if no changes were made, simply dismiss the modal
    if (Util.isEmptyObject(record)) {
      Modal.close();
      return;
    }

    Stock.stockAssign.create(vm.model)
      .then(res => {
        Receipts.stockAssignmentReceipt(res.uuid, true);
        Modal.close(true);
      })
      .catch(Notify.handleError);
  };

  /**
   *
   */
  function startup() {
    vm.loading = true;

    if (data.depot_uuid) {
      vm.model.depot_uuid = data.depot_uuid;
      loadAvailableInventories(data.depot_uuid)
        .then(() => {
          if (data.inventory_uuid) {
            vm.selectedInventory = vm.availableInventories.find(elt => elt.inventory_uuid === data.inventory_uuid);
            vm.inventory_uuid = data.inventory_uuid;
            onSelectInventory(vm.selectedInventory);
          }
        })
        .catch(Notify.handleError)
        .finally(() => {
          vm.loading = false;
        });
    } else {
      vm.loading = false;
    }
  }

  /**
   * Load inventories and lots of the given depot which are not assigned
   * for being used in a new assignment
   * @param {string} depotUuid
   */
  function loadAvailableInventories(depotUuid) {
    if (!depotUuid) { return 0; }

    // load available inventories of the given depot
    return Stock.lots.read(null, {
      depot_uuid : depotUuid,
      is_assigned : 0,
      includeEmptyLot : 0,
    })
      .then(rows => {
        computeAvailableInventories(rows);
        return vm.availableInventories;
      });
  }

  /**
   * Since data contains inventories and lots that we need, we do not want to
   * perform others queries to the server, so we extract inventories and lots
   * from the data given
   * @param {Array} invData
   */
  function computeAvailableInventories(invData) {
    vm.globalAvailableLots = invData;
    vm.groupedInventories = Util.groupBy(invData, 'inventory_uuid');
    const uniqueInventoriesUuids = Util.uniquelize(invData.map(item => item.inventory_uuid));
    vm.availableInventories = uniqueInventoriesUuids.map(inventoryUuid => vm.groupedInventories[inventoryUuid][0]);
    vm.availableInventories.forEach(item => {
      item.hrLabel = `[${item.code}] ${item.text}`;
    });
  }

  startup();
}
