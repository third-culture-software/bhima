angular.module('bhima.controllers')
  .controller('StockEntryController', StockEntryController);

// dependencies injections
StockEntryController.$inject = [
  '$state', '$transition$', 'InventoryService', 'NotifyService', 'SessionService', 'util',
  'bhConstants', 'ReceiptModal', 'PurchaseOrderService',
  'StockFormService', 'StockService', 'StockModalService', 'StockEntryExitTypeService',
  'DepotService', 'ShipmentService', 'LotService', 'ExchangeRateService',
  'uiGridConstants', 'Store', 'uuid', '$translate',
];

/**
 * @class StockEntryController
 *
 * @description
 * This controller is responsible to handle stock entry module.
 */
function StockEntryController(
  $state, $transition$, Inventory, Notify, Session, util,
  bhConstants, ReceiptModal, Purchase,
  StockForm, Stock, StockModal, EntryTypes,
  Depot, Shipments, Lots, Exchange,
  uiGridConstants, Store, Uuid, $translate,
) {
  // variables
  let inventoryStore;

  // constants
  const vm = this;
  const mapEntry = initEntryMap();
  const { params } = $state;

  vm.selectedEntryType = {};

  // view models variables and methods
  vm.stockForm = new StockForm('StockEntry');
  vm.maxLength = util.maxLength;
  vm.maxDate = new Date();
  vm.entryOption = false;
  vm.resetEntryExitTypes = false;
  vm.enterprise = Session.enterprise;
  vm.currencyId = vm.enterprise.currency_id;
  vm.movement = {};
  vm.addItems = addItems;
  vm.removeItem = removeItem;
  vm.selectEntryType = selectEntryType;
  vm.setInitialized = setInitialized;
  vm.buildStockLine = buildStockLine;
  vm.setLots = setLots;
  vm.submit = submit;
  vm.reset = reset;
  vm.onDateChange = onDateChange;
  vm.$loading = false;
  vm.generateAssetBarcodes = StockModal.openGenerateAssetBarcodes;
  vm.stockSettings = Session.stock_settings;
  vm.displayPackaging = false;

  vm.gridOptions = {
    appScopeProvider : vm,
    enableSorting : false,
    enableColumnMenus : false,
    columnDefs : [
      {
        field : 'status',
        width : 25,
        displayName : '',
        cellTemplate : 'modules/stock/entry/templates/status.tmpl.html',
      },

      {
        field : 'code',
        width : 120,
        displayName : 'TABLE.COLUMNS.CODE',
        headerCellFilter : 'translate',
        cellTemplate : 'modules/stock/entry/templates/code.tmpl.html',
      },

      {
        field : 'description',
        displayName : 'TABLE.COLUMNS.DESCRIPTION',
        headerCellFilter : 'translate',
        cellTemplate : 'modules/stock/entry/templates/description.tmpl.html',
      },

      {
        field : 'unit_type',
        width : 150,
        displayName : 'TABLE.COLUMNS.UNIT',
        headerCellFilter : 'translate',
        cellFilter : 'translate',
      },

      {
        field : 'lot',
        width : 150,
        displayName : 'TABLE.COLUMNS.LOT',
        headerCellFilter : 'translate',
        cellTemplate : 'modules/stock/entry/templates/lot.tmpl.html',
      },
      {
        field : 'packaging',
        displayName : '',
        width : 40,
        headerCellFilter : 'translate',
        cellFilter : 'translate',
        visible      : false,
        cellTemplate : 'modules/stock/entry/templates/packaging.cell.tmpl.html',
      }, {
        field : 'quantity',
        width : 150,
        displayName : 'TABLE.COLUMNS.QUANTITY',
        headerCellFilter : 'translate',
        cellTemplate : 'modules/stock/entry/templates/quantity.tmpl.html',
        aggregationType : uiGridConstants.aggregationTypes.sum,
      },
      {
        field : 'is_asset',
        width : 100,
        displayName : 'FORM.LABELS.ASSET',
        headerCellFilter : 'translate',
        cellTemplate : '/modules/inventory/list/templates/asset.cell.tmpl.html',
      },

      {
        field : 'actions',
        width : 25,
        cellTemplate : 'modules/stock/entry/templates/actions.tmpl.html',
      },
    ],
    data : vm.stockForm.store.data,
    fastWatch : true,
    flatEntityAccess : true,
  };

  vm.onSelectFundingSource = fundingSource => {
    vm.fundingSource = fundingSource;
  };

  // on change depot
  vm.onChangeDepot = depot => {
    vm.depot = depot;

    vm.displayPackaging = false;

    const columnPackaging = vm.gridOptions.columnDefs.find(col => col.field === 'packaging');
    if (vm.stockSettings.enable_packaging_pharmaceutical_products && vm.movement.entry_type === 'transfer_reception'
      && vm.depot.is_count_per_container) {
      vm.displayPackaging = true;
    }

    columnPackaging.visible = vm.displayPackaging;

    loadInventories();
  };

  /**
   * @function initEntryMap
   * @description return an object map for the mapEntry constant
   */
  function initEntryMap() {
    return {
      purchase : { find : findPurchase, submit : submitPurchase },
      donation : { find : handleDonationSelection, submit : submitDonation },
      integration : { find : handleIntegrationSelection, submit : submitIntegration },
      transfer_reception : { find : findTransfer, submit : submitTransferReception },
    };
  }

  /**
   * @method onDateChange
   * @param {date} date
   * @description on change in bhDateEditor component update the date
   */
  function onDateChange(date) {
    if (typeof date === 'undefined') {
      // Ignore intermediate invalid date strings (eg, 15/03/201)
      return;
    }
    vm.movement.date = date;

    // Check all stock lines and their lots to make sure that all
    // the lot expiration statuses are still valid
    vm.stockForm.store.data.forEach(stockLine => {

      // Check the expiration status of all previously selected lots
      if (stockLine.lots) {
        stockLine.lots.forEach(lot => {
          if (lot.expiration_date > vm.movement.date) {
            lot.expired = true;
            lot.isValid = false;
            lot.isInvalid = true;
            stockLine.isValid = false;
          }
        });
      }

      // Update expiration status of the available and candidate lots
      stockLine.availableLots.forEach(lot => {
        lot.expired = lot.expiration_date > vm.movement.data;
      });
      stockLine.candidateLots = stockLine.availableLots.filter(lot => !lot.expired);
    });
  }

  /**
   * @method reset
   * @param {object} form
   * @description reset the form after submission or on clear
   */
  function reset(form = mapEntry.form) {
    vm.stockForm.store.clear();
    form.$setPristine();
    form.$setUntouched();
    vm.movement = { date : new Date() };
    vm.entityAllowAddItems = false;
    vm.resetEntryExitTypes = true;
  }

  /**
   * @method selectEntryType
   * @param {object} entryType
   * @description called when an entry type is selected
   */
  function selectEntryType(entryType) {
    mapEntry[entryType.label].find();
    vm.movement.entry_type = entryType.label;
    vm.stockForm.store.clear();
    vm.resetEntryExitTypes = false;
    vm.displayPackaging = false;

    /**
     * do not allow the user to assing funding_source for
     * "allow_entry_transfer"
     */
    vm.allowFundingSource = entryType.label !== 'transfer_reception';

    /**
     * if false, the bhAddItems will be deactived
     * the bhAddItems must be deactivated if no entity is selected
     * or if the selected entity is `purchase` or `transfer_reception`
     */
    vm.entityAllowAddItems = !!(vm.movement.entry_type)
      && (vm.movement.entry_type !== 'purchase' && vm.movement.entry_type !== 'transfer_reception');

    const columnPackaging = vm.gridOptions.columnDefs.find(col => col.field === 'packaging');
    if (vm.stockSettings.enable_packaging_pharmaceutical_products && vm.movement.entry_type === 'transfer_reception'
      && vm.depot.is_count_per_container) {
      vm.displayPackaging = true;
    }

    columnPackaging.visible = vm.displayPackaging;
  }

  /**
   * @method setInitialized
   * @param {object} item
   * @description [grid] set initialized to true on the passed item
   */
  function setInitialized(item) {
    item._initialised = true;
  }

  /**
   * @method addItems
   * @param {number} n
   * @description [grid] add n items (rows) in the grid and call a validation function on each rows
   */
  function addItems(n) {
    vm.stockForm.addItems(n);
    vm.hasValidInput = hasValidInput();
  }

  /**
   * @method removeItem
   * @param {number} index
   * @description [grid] remove the row with the given index and call a validation function on each remaining rows
   */
  function removeItem(index) {
    vm.stockForm.removeItem(index);
    vm.hasValidInput = hasValidInput();
  }

  /**
   * @method setupStock
   * @description [grid] setup the grid and clear all previous values
   */
  function setupStock() {
    vm.stockForm.setup();
    vm.stockForm.store.clear();
  }

  /**
   * @method startup
   * @description
   * The first function to be called, it init :
   * - A list of inventories
   * - An object dor a movement
   * - A depot from the cache or give possiblity of choosing one if not set
   */
  function startup() {
    vm.$loading = true;

    // init a movement object
    vm.movement = {
      date : new Date(),
      entity : {},
    };

    if (params.shipment) {
      vm.loading = true;
      Exchange.read()
        .then(() => {
          // First load details about the shipments
          return Shipments.read(params.shipment);
        })
        .then(shipment => {
          vm.shipment = shipment;
          // Get the destination depot specified by the shipment
          return Depot.read(shipment.destination_depot_uuid);
        })
        .then(destDepot => {
          destDepot.shipment = vm.shipment;
          vm.depot = destDepot;
          // load/reload all purchasable inventories for this depot
          return loadInventories();
        })
        .then(() => {
          // Get the lots for this shipment
          return Stock.movements.read(null, { document_uuid : vm.shipment.document_uuid });
        })
        .then((allTransfers) => {
          // Note: Always assume partial entries are possible
          const transfers = Stock.filterPartialTransfers(allTransfers);
          if (transfers.length === 0) {
            // Complain if we try to use a shipment that has already been completed
            Notify.warn($translate.instant('STOCK.TRANSFER_COMPLETED'), 6000);
          } else {
            handleSelectedEntity(transfers, 'transfer_reception');
            setSelectedEntity(vm.movement.entity.instance);

            const transferType = EntryTypes.entryTypes.find(item => item.label === 'transfer_reception');
            vm.selectedEntryType = transferType;
            vm.movement.entry_type = transferType.label;

            vm.resetEntryExitTypes = false;
            vm.entityAllowAddItems = false;

            vm.hasValidInput = hasValidInput();
          }

          return Exchange.read();
        })
        .catch(Notify.handleError)
        .finally(() => {
          toggleLoadingIndicator();
        });
    } else {
      // Load the exchange rates
      Exchange.read()
        .then(() => {
          // loading all purchasable inventories
          loadInventories();
        })
        .catch(Notify.handleError)
        .finally(() => {
          toggleLoadingIndicator();
        });
    }
  }

  /**
   * @method loadInventories
   * @description load inventories
   */
  function loadInventories() {
    setupStock();
    return Inventory.read(null, { skipTags : true })
      .then((inventories) => {
        vm.inventories = inventories;
        inventoryStore = new Store({ identifier : 'uuid', data : inventories });
        return true;
      })
      .catch(Notify.handleError);
  }

  /**
   * @method resetSelectedEntity
   * @description
   * reset the selected entity (purchase | integration | donation | transfer)
   * variables and properties
   */
  function resetSelectedEntity() {
    vm.movement.entity = {};
    vm.movement.entry_type = null;
    vm.movement.description = null;
    vm.reference = null;
    vm.displayName = null;
    vm.resetEntryExitTypes = true;
    vm.currencyId = vm.enterprise.currency_id;
  }

  /**
   * @method handleSelectedEntity
   * @param {object} _entities
   * @param {object} _type
   * @description
   * set movement information according the selected entity and populate the grid
   */
  function handleSelectedEntity(_entities, _type) {
    if (!_entities || !_entities.length) {
      resetSelectedEntity();
      return;
    }

    vm.movement.entity = {
      uuid : _entities[0].uuid,
      type : _type,
      instance : _entities[0],
    };

    // set the description
    setDescription(vm.movement.entity);

    // populate the grid
    populate(_entities);
  }

  /**
   * @method setDescription
   * @param {object} entity
   * @description set the description of the movement
   */
  function setDescription(entity) {
    const map = {
      purchase : 'STOCK.PURCHASE_DESCRIPTION',
      donation : 'STOCK.RECEPTION_DONATION',
      integration : 'STOCK.RECEPTION_INTEGRATION',
      transfer_reception : 'STOCK.RECEPTION_DESCRIPTION',
    };
    if (!entity || !entity.uuid) { return; }

    const description = $translate.instant(map[entity.type], {
      supplier : entity.instance.supplier_name,
      purchase_order : entity.instance.reference,
    });

    vm.movement.description = description;
  }

  /**
   * @method findPurchase
   * @description pop up  a modal to let user find a purchase order
   */
  function findPurchase() {
    StockModal.openFindPurchase()
      .then((purchase) => {
        vm.originalPO = purchase;
        handleSelectedEntity(purchase, 'purchase');
        setSelectedEntity(vm.movement.entity.instance);
        vm.currencyId = vm.movement.entity.instance.currency_id || vm.currencyId;
      })
      .catch(Notify.handleError);
  }

  /**
   * @method findTransfer
   * @description pop up  a modal to let user find a transfer to receive
   */
  function findTransfer() {
    StockModal.openFindTransfer({ depot_uuid : vm.depot.uuid })
      .then((transfers) => {
        handleSelectedEntity(transfers, 'transfer_reception');
        setSelectedEntity(vm.movement.entity.instance);
        vm.hasValidInput = hasValidInput();
      })
      .catch(Notify.handleError);
  }

  /**
   * @method handleIntegrationSelection
   * @description reset the form for a new integration entry
   */
  function handleIntegrationSelection() {
    const description = $translate.instant('STOCK.RECEPTION_INTEGRATION');
    initSelectedEntity(description);
    if (vm.gridOptions.data.length === 0) {
      vm.addItems(1);
    }
  }

  /**
   * @method handleDonationSelection
   * @description reset the form for a new donation entry
   */
  function handleDonationSelection() {
    const description = $translate.instant('STOCK.RECEPTION_DONATION');
    initSelectedEntity(description);
    if (vm.gridOptions.data.length === 0) {
      vm.addItems(1);
    }
  }

  /**
   * @method populate
   * @param {object} items
   * @description fill the grid with inventories contained in the purchase order or transfer
   */
  function populate(items) {
    if (!items.length) { return; }

    // clear the store before adding new items
    vm.stockForm.store.clear();

    // adding items.length line in the stockForm store, which will be reflected to the grid
    vm.stockForm.addItems(items.length);

    vm.stockForm.store.data.forEach((item, index) => {
      const inventory = inventoryStore.get(items[index].inventory_uuid);
      item.code = inventory.code;
      item.inventory_uuid = inventory.uuid;
      item.label = inventory.label;
      item.unit_cost = items[index].unit_price || items[index].unit_cost; // transfer comes with unit_cost
      item.quantity = items[index].balance || items[index].quantity;
      item.cost = item.quantity * item.unit_cost;
      item.expiration_date = vm.movement.date || new Date();
      item.unit_type = inventory.unit_type;
      item.package_size = items[index].package_size || 1;

      if (item.package_size > 1) {
        item.numberPackage = Math.floor(item.quantity / item.package_size);
      }

      // Store the non-expired candidate lots for this inventory code
      Lots.candidates({ inventory_uuid : item.inventory_uuid, date : vm.movement.date })
        .then((lots) => {
          item.availableLots = lots;
          item.candidateLots = lots.filter(lot => !lot.expired);
          return Inventory.inventoryWac(item.inventory_uuid);
        })
        .then(inventoryWacDetails => {
          if (!inventoryWacDetails) { return; }
          item.wacValue = inventoryWacDetails.wac;

          // in case of transfer reception
          // we force the movement to be made with current WAC
          // since there is no way to edit the unit cost in this case
          if (vm.movement.entity.type === 'transfer_reception') {
            item.unit_cost = inventoryWacDetails.wac;
            item.cost = item.quantity * item.unit_cost;
          }
        });

      if (vm.movement.entity.type === 'transfer_reception') {
        item.lots.push({
          isValid : true,
          lot : items[index].label,
          quantity : item.quantity,
          serial_number : items[index].serial_number,
          expiration_date : new Date(items[index].expiration_date),
          acquisition_date : new Date(items[index].acquisition_date),
          uuid : items[index].uuid,
        });
      }

      setInitialized(item);
    });
  }

  /**
   * @method initSelectedEntity
   * @param {string} description
   * @description initialize description and label for the selected entity
   */
  function initSelectedEntity(description) {
    vm.displayName = '';
    vm.reference = '';
    vm.movement.description = description;
    vm.currencyId = vm.enterprise.currency_id;
  }

  /**
   * @method setSelectedEntity
   * @param {entity} entity
   * @description set the label of the selected entity
   */
  function setSelectedEntity(entity) {
    if (!entity) { return; }

    const uniformEntity = Stock.uniformSelectedEntity(entity);
    vm.reference = entity.documentReference || uniformEntity.reference;
    vm.displayName = entity.depot_text || uniformEntity.displayName;
  }

  /**
   * @method setLots
   * @param {object} stockLine
   * @description [grid] pop up a modal for defining lots for each row in the grid
   */
  function setLots(stockLine) {
    if (!stockLine.inventory_uuid) {
      // Prevent the lots modal pop-up if new inventory code has been selected
      return;
    }
    // Additional information for an inventory Group
    const inventory = inventoryStore.get(stockLine.inventory_uuid);

    stockLine.tracking_expiration = inventory.tracking_expiration;
    stockLine.unique_item = inventory.unique_item;
    stockLine.is_asset = inventory.is_asset;
    stockLine.is_count_per_container = inventory.is_count_per_container;
    if (stockLine.lots && stockLine.lots.length > 0) {
      stockLine.quantity = stockLine.lots.reduce((n, row) => n + row.quantity, 0);
    } else {
      stockLine.quantity = inventory.is_asset ? 1 : 0;

      if (inventory.is_count_per_container && vm.depot.is_count_per_container) {
        stockLine.package_size = 0;
        stockLine.box_unit_cost = 0;
        stockLine.number_packages = 0;
      }
    }

    StockModal.openDefineLots({
      stockLine,
      entry_type : vm.movement.entry_type,
      currency_id : vm.currencyId,
      depotPackaged : vm.depot.is_count_per_container,
    })
      .then((res) => {
        if (!res) { return; }
        stockLine.lots = res.lots;
        stockLine.quantity = res.quantity;
        stockLine.unit_cost = res.unit_cost; // integration and donation price are defined in the lot modal

        if (vm.movement.entry_type === 'purchase' && res.openMultiplePackaging) {
          vm.addItems(1);
          const lastIndex = vm.stockForm.store.data.length - 1;

          const dataInventory = inventoryStore.get(stockLine.inventory_uuid);

          vm.stockForm.store.data[lastIndex].code = dataInventory.code;
          vm.stockForm.store.data[lastIndex].inventory_uuid = dataInventory.uuid;
          vm.stockForm.store.data[lastIndex].label = dataInventory.label;
          vm.stockForm.store.data[lastIndex].unit_cost = stockLine.unit_price || stockLine.unit_cost;
          vm.stockForm.store.data[lastIndex].quantity = 0;
          vm.stockForm.store.data[lastIndex].expiration_date = vm.movement.date || new Date();
          vm.stockForm.store.data[lastIndex].unit_type = dataInventory.unit_type;
          vm.stockForm.store.data[lastIndex].package_size = stockLine.package_size || 1;
          vm.stockForm.store.data[lastIndex]._initialised = true;

          // Store the non-expired candidate lots for this inventory code
          Lots.candidates({
            inventory_uuid : vm.stockForm.store.data[lastIndex].inventory_uuid,
            date : vm.movement.date,
          })
            .then((lots) => {
              vm.stockForm.store.data[lastIndex].availableLots = lots;
              vm.stockForm.store.data[lastIndex].candidateLots = lots.filter(lot => !lot.expired);
              return Inventory.inventoryWac(vm.stockForm.store.data[lastIndex].inventory_uuid);
            })
            .then(inventoryWacDetails => {
              if (!inventoryWacDetails) { return; }
              vm.stockForm.store.data[lastIndex].wacValue = inventoryWacDetails.wac;

              // in case of transfer reception
              // we force the movement to be made with current WAC
              // since there is no way to edit the unit cost in this case
              if (vm.movement.entity.type === 'transfer_reception') {
                vm.stockForm.store.data[lastIndex].unit_cost = inventoryWacDetails.wac;
                vm.stockForm.store.data[lastIndex].cost = vm.stockForm.store.data[lastIndex].quantity
                  * vm.stockForm.store.data[lastIndex].unit_cost;
              }
            });

        }

        vm.hasValidInput = hasValidInput();
      })
      .catch(Notify.handleError);
  }

  /**
   * @function hasValidInput
   * @description [grid] check if all rows in the grid have lots defined
   */
  function hasValidInput() {
    return vm.stockForm.store.data.every(line => line.lots.length > 0);
  }

  /**
   * @method setFundingSource
   * @description set the funding source for all grid lines
   */
  function setFundingSource(lots) {
    return lots.map((line) => {
      line.funding_source_uuid = vm.fundingSource ? vm.fundingSource.uuid : null;
      return line;
    });
  }

  /**
   * @method submit
   * @param {object} form
   * @description send data to the server for a stock entry
   */
  function submit(form) {
    if (form.$invalid) {
      return Notify.danger('FORM.ERRORS.INVALID');
    }

    if (!vm.movement.entry_type) {
      return Notify.danger('ERRORS.ER_NO_STOCK_SOURCE');
    }
    vm.$loading = true;

    mapEntry.form = form;
    return mapEntry[vm.movement.entry_type].submit()
      .then(toggleLoadingIndicator);
  }

  /**
   * @method toggleLoadingIndicator
   * @description toggle value for the loading indicator
   */
  function toggleLoadingIndicator() {
    vm.$loading = !vm.$loading;
  }

  /**
   * @method submitPurchase
   * @description prepare the stock movement and send data to the server as new entry from a purchase
   */
  function submitPurchase() {
    const movement = {
      depot_uuid  : vm.depot.uuid,
      entity_uuid : vm.movement.entity.uuid, // The purchase order UUID
      date        : vm.movement.date,
      description : vm.movement.description,
      flux_id     : bhConstants.flux.FROM_PURCHASE,
      user_id     : vm.stockForm.details.user_id,
    };

    movement.lots = Stock.processLotsFromStore(vm.stockForm.store.data, vm.movement.entity.uuid);

    if (vm.fundingSource) {
      movement.lots = setFundingSource(movement.lots);
    }

    const exchangeRate = Exchange.getCurrentRate(vm.currencyId);

    // If there are shipping and handling charges, distribute them to the individual lot articles
    if (vm.originalPO[0].shipping_handling) {

      // Compute the cost of the original order (in PO currency), not including shipping+handling
      const costPO = vm.originalPO.reduce((accum, lot) => accum + lot.unit_price * lot.quantity, 0.0);

      // Compute the ratio of the original PO shipping+handling costs to the total cost of lots
      // (Note that the total shipping_handling is copied to each lot in originalPO)
      const SHRatio = vm.originalPO[0].shipping_handling / costPO;

      // Adjust the article unit price by distributing the shipping+handling costs
      movement.lots.forEach(lot => {
        lot.unit_cost = ((lot.unit_cost * lot.quantity) * (1.0 + SHRatio)) / lot.quantity;
      });
    }

    // fix the unit cost, if necessary
    if (vm.currencyId !== vm.enterprise.currency_id) {
      movement.lots.forEach(lot => {
        lot.unit_cost /= exchangeRate;
      });
    }

    return Stock.stocks.create(movement)
      .then(document => {
        vm.document = document;
        return Purchase.stockStatus(vm.movement.entity.uuid);
      })
      .then(() => {
        vm.reset();
        ReceiptModal.stockEntryPurchaseReceipt(vm.document.uuid, true);
      })
      .catch(Notify.handleError);
  }

  /**
   * @method submitIntegration
   * @description prepare the stock movement and send data to the server as new stock integration
   */
  function submitIntegration() {
    const movement = {
      depot_uuid  : vm.depot.uuid,
      entity_uuid : null,
      date        : vm.movement.date,
      description : vm.movement.description,
      flux_id     : bhConstants.flux.FROM_INTEGRATION,
      user_id     : vm.stockForm.details.user_id,
    };

    const entry = {
      lots : Stock.processLotsFromStore(vm.stockForm.store.data, movement.entity_uuid),
      movement,
    };

    if (vm.fundingSource) {
      entry.lots = setFundingSource(entry.lots);
    }

    return Stock.integration.create(entry)
      .then(document => {
        vm.reset();
        ReceiptModal.stockEntryIntegrationReceipt(document.uuid, true);
      })
      .catch(Notify.handleError);
  }

  /**
   * @method submitDonation
   * @description prepare the stock movement and send data to the server as new stock donation
   * @TODO: add a donor management module
   */
  function submitDonation() {
    const movement = {
      depot_uuid  : vm.depot.uuid,
      entity_uuid : null,
      date        : vm.movement.date,
      description : vm.movement.description,
      flux_id     : bhConstants.flux.FROM_DONATION,
      user_id     : vm.stockForm.details.user_id,
    };

    movement.lots = Stock.processLotsFromStore(vm.stockForm.store.data, Uuid());

    if (vm.fundingSource) {
      movement.lots = setFundingSource(movement.lots);
    }

    return Stock.stocks.create(movement)
      .then((document) => {
        vm.reset();
        ReceiptModal.stockEntryDonationReceipt(document.uuid, true);
      })
      .catch(Notify.handleError);
  }

  /**
   * @method submitTransferReception
   * @description prepare the stock movement and send data to the server as new stock reception of transfer
   */
  function submitTransferReception() {
    const movement = {
      from_depot    : vm.movement.entity.instance.depot_uuid,
      to_depot      : vm.depot.uuid,
      document_uuid : vm.movement.entity.instance.document_uuid,
      date          : vm.movement.date,
      description   : vm.movement.description,
      isExit        : false,
      user_id       : vm.stockForm.details.user_id,
    };

    if (vm.shipment) {
      movement.shipment_uuid = vm.shipment.uuid;
    }

    movement.lots = Stock.processLotsFromStore(vm.stockForm.store.data, null);

    return Stock.movements.create(movement)
      .then((document) => {
        vm.reset();
        ReceiptModal.stockEntryDepotReceipt(document.uuid, true)
          .then(() => {
            if (($transition$.from().name === 'shipments') && !!params.shipment) {
              $state.go('shipments');
            }
          });
      })
      .catch(Notify.handleError);
  }

  /**
   * @method buildStockLine
   * @param {object} line
   * @description [grid] initialize each cell of defined rows with value
   */
  function buildStockLine(line) {

    // Store the non-expired candidate lots for this inventory code
    Lots.candidates({ inventory_uuid : line.inventory_uuid, date : vm.movement.date })
      .then((lots) => {
        line.availableLots = lots;
        line.candidateLots = lots.filter(lot => !lot.expired);

        const inventory = inventoryStore.get(line.inventory_uuid);
        const entryDate = vm.movement.date || Date();

        line.code = inventory.code;
        line.label = inventory.label;
        line.unit_cost = inventory.price;
        line.is_asset = inventory.is_asset;
        line.quantity = inventory.is_asset ? 1 : 0;
        line.cost = line.quantity * line.unit_cost;
        line.expiration_date = entryDate;
        line.unit_type = inventory.unit_type;
        line.tracking_expiration = inventory.tracking_expiration;
        line.candidateLots.forEach(lot => {
          lot.tracking_expiration = line.tracking_expiration;
        });
        setInitialized(line);

        return Inventory.inventoryWac(line.inventory_uuid);
      })
      .then(inventoryWacDetails => {
        if (!inventoryWacDetails) { return; }
        line.wac = inventoryWacDetails.wac;
      })
      .catch(Notify.handleError);
  }

  startup();
}
