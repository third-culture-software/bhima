angular.module('bhima.controllers')
  .controller('CreateShipmentController', CreateShipmentController);

// dependencies injections
CreateShipmentController.$inject = [
  '$state', 'ShipmentService', 'DepotService', 'StockExitFormService',
  'ShipmentModalService', 'ShipmentContainerService', 'uiGridConstants',
  'BarcodeService', 'NotifyService', 'bhConstants', 'uuid', '$translate', '$timeout',
  'SessionService', 'StockModalService',
];

/**
 *
 * @param $state
 * @param Shipment
 * @param Depot
 * @param StockForm
 * @param ShipmentModal
 * @param Containers
 * @param uiGridConstants
 * @param Barcode
 * @param Notify
 * @param bhConstants
 * @param Uuid
 * @param $translate
 * @param $timeout
 * @param Session
 * @param StockModal
 */
function CreateShipmentController(
  $state, Shipment, Depot, StockForm,
  ShipmentModal, Containers, uiGridConstants,
  Barcode, Notify, bhConstants, Uuid, $translate, $timeout,
  Session, StockModal,
) {
  const { NOT_CREATED } = Containers;

  const vm = this;

  vm.loading = false;
  vm.enablePackaging = false;

  vm.depot = {};

  const shipmentUuid = $state.params.uuid;
  vm.stockSettings = Session.stock_settings;

  vm.existingShipmentUuid = shipmentUuid;

  vm.isCreateState = $state.params.isCreateState;

  vm.shipment = {};
  vm.containers = [];

  vm.totalQuantity = 0;
  vm.totalWeight = 0;

  vm.stockForm = new StockForm('ShipmentForm');
  vm.stockForm.setAllowExpired(false);
  vm.stockForm.setExitTypePredefined(true);
  vm.stockForm.setExitType('depot');

  vm.setPackaging = setPackaging;

  const gridColumns = [
    {
      field : 'container_label',
      width : 150,
      displayName : 'SHIPMENT.CONTAINER',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/shipment/templates/container.tmpl.html',
      sort : { direction : uiGridConstants.ASC, priority : 0 },
      visible : false,
    }, {
      field : '_selected',
      width : 25,
      headerCellTemplate : `
        <div style="text-align: center;"><i class="fa fa-check" style="margin: 0; vertical-align: bottom;"></i></div>`,
      cellTemplate : 'modules/shipment/templates/checkbox.tmpl.html',
      enableSorting : false,
      visible : false,
    }, {
      field : '_spacer',
      displayName : '',
      width : 10,
      enableSorting : false,
      visible : false,
    }, {
      field : 'status',
      width : 25,
      displayName : '',
      cellTemplate : 'modules/stock/exit/templates/status.tmpl.html',
      enableSorting : false,
    }, {
      field : 'code',
      displayName : 'INVENTORY.CODE',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/exit/templates/code.tmpl.html',
      enableSorting : false,
    }, {
      field : 'description',
      displayName : 'TABLE.COLUMNS.DESCRIPTION',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/exit/templates/description.tmpl.html',
      enableSorting : false,
    }, {
      field : 'lot',
      displayName : 'TABLE.COLUMNS.LOT',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/exit/templates/lot.tmpl.html',
      enableSorting : false,
      footerCellTemplate : `<div class="ui-grid-cell-contents text-right" >
        ${$translate.instant('FORM.LABELS.TOTAL')}:
      </div>`,
    }, {
      field : 'packaging',
      displayName : '',
      width : 40,
      headerCellFilter : 'translate',
      cellFilter : 'translate',
      visible      : false,
      cellTemplate : 'modules/shipment/templates/packaging.cell.tmpl.html',
    }, {
      field : 'quantity',
      width : 100,
      displayName : 'TABLE.COLUMNS.QUANTITY',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/shipment/templates/quantity.tmpl.html',
      footerCellTemplate : `<div class="ui-grid-cell-contents text-right wrappingColHeader" >
         {{ grid.appScope.totalQuantity }}
         </div>`,
      enableSorting : false,
    }, {
      field : 'unit_weight',
      width : 120,
      displayName : 'TABLE.COLUMNS.UNIT_WEIGHT',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/shipment/templates/unit_weight.tmpl.html',
      footerCellClass : 'text-right',
      footerCellTemplate : `<div class="ui-grid-cell-contents" >
         {{ grid.appScope.totalWeight }}
         </div>'`,
      enableSorting : false,
    }, {
      field : 'unit_type',
      width : 75,
      displayName : 'TABLE.COLUMNS.UNIT',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/inventories/templates/unit.tmpl.html',
      enableSorting : false,
    }, {
      field : '_quantity_available',
      width : 150,
      displayName : 'TABLE.COLUMNS.AVAILABLE',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/exit/templates/available.tmpl.html',
      enableSorting : false,
    }, {
      displayName : '',
      field : 'actions',
      width : 25,
      cellTemplate : 'modules/stock/exit/templates/actions.tmpl.html',
      enableSorting : false,
    },
  ];

  vm.gridOptions = {
    appScopeProvider   : vm,
    columnDefs         : gridColumns,
    enableColumnMenus  : false,
    enableSorting      : true,
    fastWatch          : true,
    flatEntityAccess   : true,
    showColumnFooter   : true,
    showGridFooter     : true,
    gridFooterTemplate : 'modules/shipment/templates/shipmentGridFooter.tmpl.html',
    data               : vm.stockForm.store.data,
    onRegisterApi,
  };

  /**
   *
   * @param gridApi
   */
  function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  }

  /**
   * @function setPackaging
   * @param {object} item
   * @description [grid] pop up a modal for defining packaging
   */
  function setPackaging(item) {
    if (!item.inventory_uuid) {
      // Prevent the packaging modal pop-up if new inventory code has been selected
      return;
    }

    StockModal.openSetPackaging({
      item,
      currency_id : vm.currencyId,
      basic : true,
    })
      .then((res) => {
        if (!res) { return; }
        item.lots = res.lots;
        item.quantity = res.quantity;

        vm.validateItems();
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function checkVisibility() {
    // Hide the container columns if there are no containers.
    const flag = vm.containers.length > 0;
    ['container_label', '_selected', '_spacer'].forEach(colName => {
      const column = vm.gridOptions.columnDefs.find(col => col.field === colName);
      column.visible = flag;
    });
    vm.gridApi.grid.refresh();
  }

  vm.today = new Date();
  vm.onChangeDepot = onChangeDepot;
  vm.getOverview = getOverview;
  vm.setReady = setReady;
  vm.submit = submit;

  vm.onSelectDestinationDepot = depot => {
    vm.shipment.destination_depot_uuid = depot.uuid;
    vm.stockForm.setDepotDistribution(depot);
  };

  /**
   *
   */
  function updateTotals() {
    // Update the total quantity and weight of all shipment items
    // (this does not include containers themselves)
    vm.totalQuantity = 0;
    vm.totalWeight = 0;
    vm.stockForm.store.data.forEach(row => {
      vm.totalQuantity += row.quantity || 0;
      vm.totalWeight += (row.quantity || 0) * (row.unit_weight || 0);
    });

    // Add the weight of any containers
    vm.containers.forEach(cntr => {
      vm.totalWeight += cntr.weight;
    });

    // Also compute the total weight of each container
    vm.containers.forEach(cntr => {
      cntr.num_items = 0;
      cntr.total_weight = cntr.weight;
      vm.stockForm.store.data.forEach(row => {
        if (row.container_label === cntr.label) {
          cntr.num_items += row.quantity;
          cntr.total_weight += (row.quantity || 0) * (row.unit_weight || 0);
        }
      });
    });
  }

  vm.validateItems = () => {
    updateTotals();
    vm.stockForm.validate(true);
    vm.messages = vm.stockForm.messages();
    checkVisibility();
  };

  vm.configureItem = function configureItem(row, lot) {
    if (lot.isAsset()) {
      // Override default quantity for assets
      lot.quantity = 1;
    }

    // If there are any containers, automatically assign new lots to the last container
    if (vm.containers.length) {
      const last = vm.containers[vm.containers.length - 1];
      lot.container_uuid = last.uuid;
      lot.container_label = last.label;
    }

    vm.stockForm.configureItem(row, lot);
    vm.validateItems();
  };

  vm.addItems = function addItems(numItems) {
    vm.stockForm.addItems(numItems);
    vm.validateItems();
  };

  vm.removeItem = function removeItem(uuid) {
    vm.stockForm.removeItem(uuid);
    vm.validateItems();
  };

  vm.setDate = function setDate(date) {
    vm.shipment.anticipated_delivery_date = date;
  };

  vm.newContainer = function newContainer() {
    ShipmentModal.openEditContainerModal({
      action : 'create',
      known : vm.containers.map(c => c.label),
    })
      .then((result) => {
        if (!result) { return; }

        // Edit container model does not actually create a container in the
        // database.   So we need to add a temporary uuid for internal use here.
        result.uuid = Uuid();
        result[NOT_CREATED] = true;
        if (!angular.isDefined(result.weight)) {
          result.weight = 0.0;
        }

        vm.containers.push(result);
        // NOTE: We are saving the data for containers but not creating
        //       containers yet.  We will do that later once the shipment itself
        //       is created.  This will prevent having to delete containers if
        //       the shipment we are creating is abandoned.

        // If this is the first container, assign all items to it
        if (vm.containers.length === 1) {
          vm.stockForm.store.data.forEach(row => {
            row.container_uuid = result.uuid;
            row.container_label = result.label;
          });
        }
      })
      .catch(Notify.handleError)
      .finally(() => {
        updateTotals();
        checkVisibility();
      });

  };

  vm.editContainer = function editContainer(container) {
    ShipmentModal.openEditContainerModal({
      action : 'edit',
      container,
      known : vm.containers.map(c => c.label),
    })
      .then((result) => {
        if (!result) { return; }

        // Update the container in memory
        // (This updates the newly created containers that are only in memory
        //  AND it updates the existing containers in memory without reloading them)
        const oldCont = vm.containers.find(cont => cont.uuid === container.uuid);
        oldCont.label = result.label;
        oldCont.weight = result.weight;
        oldCont.description = result.description;
        oldCont.container_type_id = result.container_type_id;
        oldCont.container_type = result.container_type;
      })
      .catch(Notify.handleError)
      .finally(() => {
        updateTotals();
      });
  };

  vm.deleteContainer = function deleteContainer(container) {

    // First, delete references in the grid rows (shipping items)
    vm.stockForm.store.data.forEach(row => {
      if (row.container_uuid === container.uuid) {
        row.container_uuid = null;
        row.container_label = null;
      }
    });

    // Next, delete the container from the list of containers in memory
    vm.containers = vm.containers.filter(cont => cont.uuid !== container.uuid);

    // Finally, if the container exists, delete it from the database
    // (Note that this also deletes any shipment_item references to it)
    if (!container[NOT_CREATED]) {
      Containers.delete(container.uuid);
    }

    updateTotals();
    checkVisibility();
  };

  vm.assignShippingItems = function assignShippingItems(container) {
    vm.stockForm.store.data.forEach(row => {
      if (row._selected) {
        row.container_uuid = container.uuid;
        row.container_label = container.label;
        row._selected = 0;
      }
    });
  };

  vm.setContainerFromDropdown = function setContainerFromDropdown(row, container) {
    row.container_label = container.label;
    row.container_uuid = container.uuid;
    updateTotals();
  };

  vm.setLotFromDropdown = function setLotFromDropdown(row, lot) {
    row._quantity_available = lot._quantity_available;
    vm.stockForm._pool.use(lot.lot_uuid);
    row.configure(lot);
    vm.stockForm.updateLotListings(row.inventory_uuid);
    vm.validateItems();
  };

  vm.getLotByBarcode = function getLotByBarcode() {
    Barcode.modal({ shouldSearch : false, label : 'BARCODE.SCAN_LOT_BARCODE' })
      .then(record => {
        if (record.uuid) {
          vm.stockForm.addLotByBarcode(record.uuid);
          vm.messages = vm.stockForm.messages();
        }
      });
  };

  vm.clear = function clear() {
    vm.stockForm.clear();

    vm.shipment = {};
    vm.containers = [];

    // trigger on change depot behavior
    // for having exit type and updated quantity
    $timeout(() => {
      onChangeDepot(vm.depot);
    }, 0);

    checkVisibility();
  };

  /**
   *
   * @param depot
   */
  function onChangeDepot(depot) {
    // depot assignment
    vm.depot = depot;
    vm.enablePackaging = false;

    vm.shipment.origin_depot_uuid = vm.depot.uuid;
    const column = vm.gridOptions.columnDefs.find(col => col.field === 'packaging');

    if (vm.depot.is_count_per_container && vm.stockSettings.enable_packaging_pharmaceutical_products) {
      vm.enablePackaging = true;
    }

    column.visible = vm.enablePackaging;
    vm.gridApi.grid.refresh();
    // When the user changes the origin depot, only delete/clear the
    // destination_depot_uuid if
    //   - We are creating a shipment, OR
    //   - We are editing a shipment and the new origin depot is the same
    //     as the previous destination depot
    if (vm.isCreateState || (vm.shipment.destination_depot.uuid === depot.uuid)) {
      delete vm.shipment.destination_depot_uuid;
    }

    // refresh quantity available
    return vm.stockForm.setDepot(depot)
      .then(() => {

        // ??? trick an exit type which is required
        vm.stockForm.setExitType('loss');
        vm.stockForm.setLossDistribution();

        // run validation
        vm.validateItems();

        return refreshQuantityAvailable(vm.depot);
      });
  }

  /**
   *
   * @param uuid
   */
  function setReady(uuid) {
    return ShipmentModal.setReadyForShipmentModal(uuid)
      .then(res => {
        if (res) { $state.go('shipments'); }
      });
  }

  /**
   *
   * @param uuid
   */
  function getOverview(uuid) {
    return ShipmentModal.shipmentDocumentModal(uuid);
  }

  /**
   *
   * @param form
   */
  function reset(form) {
    form.$setPristine();
    form.$setUntouched();
    vm.stockForm.store.clear();
  }

  /**
   *
   */
  function startup() {
    vm.loading = true;
    vm.hasError = false;

    vm.stockForm.setup();
    vm.stockForm.setExitType('depot');

    // load the shipment for update
    loadShipment();
  }

  /**
   *
   * @param depot
   * @param dateTo
   */
  function refreshQuantityAvailable(depot, dateTo = new Date()) {
    return fetchAllocatedAssets()
      .then(assets => {
        // NOTE: By "allocated" we mean allocated to previous shipments
        //       therefore unavailable for this shipment
        vm.alreadyAllocated = assets;

        // compute allocated quantites
        const allocatedQuantityMap = vm.alreadyAllocated.reduce((map, asset) => {
          const prev = (map[asset.lot_uuid] || 0);
          map[asset.lot_uuid] = asset.quantity_sent + prev;
          return map;
        }, {});

        // remove used items from the pool
        const usedItems = vm.stockForm._pool.available.data.filter(lot => {
          const allocatedQuantity = allocatedQuantityMap[lot.lot_uuid] || 0;

          if (allocatedQuantity) {
            lot._quantity_available -= allocatedQuantity;
          }

          return lot._quantity_available === 0 && allocatedQuantity > 0;
        });

        // remove the used items from the pool
        usedItems.forEach(lot => vm.stockForm._pool.use(lot.lot_uuid));

        vm.validateItems();

        return Shipment.read(null, { depot_uuid : depot.uuid, dateTo, skipTags : true });
      })
      .then(list => {
        vm.existingShipments = list;
      });
  }

  /**
   *
   * @param row
   */
  function errorLineHighlight(row) {
    const { ROW_ERROR_FLAG } = bhConstants.grid;
    // set and unset error flag for allowing to highlight again the row
    // when the user click again on the submit button
    row[ROW_ERROR_FLAG] = true;
    $timeout(() => { row[ROW_ERROR_FLAG] = false; }, 3000);
  }

  /**
   *
   * @param form
   */
  function submit(form) {

    // This is a work-round to make sure that updating shipments works
    // (The exit_type is getting lost somehow, possibly because we are
    //  using StockExitForm in an unconventional way).
    vm.stockForm.details.exit_type = 'depot';

    if (form.$invalid) {
      vm.validateItems();

      // Prepend general form needs fixing message
      const formMsg = {
        type : 'warn',
        text : 'STOCK.MESSAGES.WARN_MAIN_FORM_ERRORS',
        keys : {},
      };
      vm.messages.unshift(formMsg);
      Notify.danger(formMsg.text, 5000);
      return null;
    }

    const isValidForSubmission = vm.stockForm.validate(true);

    // check if the lots in the form are valid
    if (isValidForSubmission === false) {

      let firstElement = true;

      vm.stockForm.store.data.forEach(row => {
        const hasErrors = row.errors().length > 0;
        if (hasErrors) {
          // flash the error highlight
          errorLineHighlight(row);

          // scroll to the first invalid item
          if (firstElement) {
            vm.gridApi.core.scrollTo(row);
            firstElement = false;
          }
        }
      });

      // flash the first error message to the user
      const [msg] = vm.stockForm.messages();
      Notify.danger(msg.text, 5000);

      return null;
    }

    vm.loading = true;

    vm.shipment = cleanShipment(vm.shipment);

    vm.shipment.lots = vm.stockForm.store.data.map(row => ({
      lot_uuid : row.lot_uuid,
      quantity : row.quantity,
      unit_weight : row.unit_weight,
      unit_type : row.unit_type,
      container_uuid : row.container_uuid,
    }));

    const promise = vm.isCreateState
      ? Shipment.create(vm.shipment)
      : Shipment.update(shipmentUuid, vm.shipment);

    return promise
      .then((res) => {
        vm.shipment.uuid = vm.isCreateState ? res.uuid : shipmentUuid;
        reset(form);
        return true;
      })
      .then(() => {
        const promises = [];
        // Create any new containers
        vm.containers.forEach((cont) => {
          if (cont[NOT_CREATED]) {
            const newContainer = { ...cont }; // clone
            newContainer.shipment_uuid = vm.shipment.uuid;
            delete newContainer[NOT_CREATED];
            promises.push(Containers.create(newContainer));
          }
        });
        return Promise.all(promises);
      })
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'SHIPMENT.CREATED' : 'SHIPMENT.UPDATED';
        Notify.success(translateKey);
        $state.go('shipments', null, { reload : true });
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  /**
   *
   * @param shipment
   */
  function cleanShipment(shipment) {
    return {
      origin_depot_uuid : shipment.origin_depot_uuid,
      destination_depot_uuid : shipment.destination_depot_uuid,
      name : shipment.name,
      description : shipment.description,
      transport_mode : shipment.transport_mode,
      receiver : shipment.receiver,
      anticipated_delivery_date : shipment.anticipated_delivery_date,
    };
  }

  // Re-add any data lost by StockExitForm
  // (This is necessary because StockExit does not know about unit_weight, etc)
  /**
   *
   * @param lots
   */
  function updateLotsData(lots) {
    vm.stockForm.store.data.forEach(row => {
      const lot = lots.find(lt => lt.lot_uuid === row.lot_uuid);
      row.unit_weight = lot.unit_weight;
      row.unit_type = lot.unit_type;
      row.container_uuid = lot.container_uuid;
      row.container_label = lot.container_label;
      row.item_uuid = lot.item_uuid;
      row._selected = 0;
    });
  }

  // this function
  /**
   *
   */
  function loadShipment() {

    if (!shipmentUuid) {
      vm.loading = false;
      return;
    }

    Shipment.readAll(shipmentUuid)
      .then(shipment => {
        vm.shipment = shipment;
        vm.shipment.anticipated_delivery_date = new Date(vm.shipment.anticipated_delivery_date);
        return Containers.list(vm.shipment.uuid);
      })
      .then((containers) => {
        vm.containers = containers;
        return Depot.read(vm.shipment.origin_depot_uuid);
      })
      .then(originDepot => {
        vm.depot = originDepot;
        return vm.stockForm.setDepot(originDepot);
      })
      .then(() => {
        return Depot.read(vm.shipment.destination_depot_uuid);
      })
      .then(destDepot => {
        delete vm.messages;
        vm.stockForm.setDepotDistribution(destDepot);
        vm.stockForm.setLotsFromShipmentList(vm.shipment.lots, 'lot_uuid');
        updateLotsData(vm.shipment.lots);
        vm.validateItems();
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  /**
   *
   */
  function fetchAllocatedAssets() {
    const isEdit = !vm.isCreateState && shipmentUuid;
    return Shipment.getAllocatedAssets({
      origin_depot_uuid : vm.depot.uuid,
      currently_at_depot : true,
      except_current_shipment : isEdit ? shipmentUuid : undefined,
    });
  }

  startup();
}
