angular.module('bhima.controllers')
  .controller('StockExitController', StockExitController);

// dependencies injections
StockExitController.$inject = [
  '$state', '$transition$', 'NotifyService', 'SessionService', 'util', 'bhConstants', 'ReceiptModal',
  'StockExitFormService', 'StockEntryExitTypeService', 'uiGridConstants', 'GridExportService', 'ShipmentService',
  'DepotService', '$timeout', 'BarcodeService', 'StockModalService',
];
/**
 * @param $state
 * @param $transition$
 * @param Notify
 * @param Session
 * @param util
 * @param bhConstants
 * @param ReceiptModal
 * @param StockForm
 * @param ExitTypes
 * @param uiGridConstants
 * @param GridExportService
 * @param Shipments
 * @param Depot
 * @param $timeout
 * @param Barcode
 * @param StockModal
 * @class StockExitController
 * @description
 * This controller is responsible to handle stock exit module.
 */
function StockExitController(
  $state, $transition$, Notify, Session, util, bhConstants, ReceiptModal,
  StockForm, ExitTypes, uiGridConstants, GridExportService, Shipments,
  Depot, $timeout, Barcode, StockModal,
) {
  const vm = this;

  const { params } = $state;

  vm.stockForm = new StockForm('StockExit');

  // set allowExpired to be false
  vm.stockForm.setAllowExpired(false);

  vm.gridApi = {};
  vm.ROW_ERROR_FLAG = bhConstants.grid.ROW_ERROR_FLAG;
  vm.DATE_FMT = bhConstants.dates.format;

  vm.enablePackaging = false;
  vm.stockSettings = Session.stock_settings;
  vm.setPackaging = setPackaging;

  // bind methods
  vm.maxLength = util.maxLength;
  vm.enterprise = Session.enterprise;

  vm.selectedExitType = {};
  vm.onSelectExitType = onSelectExitType;
  vm.destLabel = '';

  vm.submit = submit;

  const gridFooterTemplate = `
    <div style="margin-left: 10px;">
      {{ grid.appScope.gridApi.core.getVisibleRows().length }}
      <span translate>TABLE.AGGREGATES.ROWS</span>
    </div>
  `;

  const gridOptions = {
    appScopeProvider : vm,
    enableSorting : false,
    enableColumnMenus : false,
    rowTemplate : 'modules/templates/grid/error.row.html',
    columnDefs : [{
      field : 'status',
      width : 25,
      displayName : '',
      cellTemplate : 'modules/stock/exit/templates/status.tmpl.html',
    }, {
      field : 'code',
      width : 120,
      displayName : 'INVENTORY.CODE',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/exit/templates/code.tmpl.html',
    }, {
      field : 'description',
      displayName : 'TABLE.COLUMNS.DESCRIPTION',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/exit/templates/description.tmpl.html',
    }, {
      field : 'lot',
      width : 250,
      displayName : 'TABLE.COLUMNS.LOT',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/exit/templates/lot.tmpl.html',
    }, {
      field : 'packaging',
      displayName : '',
      width : 40,
      headerCellFilter : 'translate',
      cellFilter : 'translate',
      visible      : false,
      cellTemplate : 'modules/stock/exit/templates/packaging.cell.tmpl.html',
    }, {
      field : 'quantity',
      width : 150,
      displayName : 'TABLE.COLUMNS.QUANTITY',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/exit/templates/quantity.tmpl.html',
      aggregationType : uiGridConstants.aggregationTypes.sum,
    }, {
      field : 'unit_type',
      width : 75,
      displayName : 'TABLE.COLUMNS.UNIT',
      headerCellFilter : 'translate',
      cellFilter : 'translate',
    }, {
      field : 'available_lot',
      width : 150,
      displayName : 'TABLE.COLUMNS.AVAILABLE',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/exit/templates/available.tmpl.html',
    }, {
      field : 'expiration_date',
      width : 150,
      displayName : 'TABLE.COLUMNS.EXPIRE_IN',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/exit/templates/expiration.tmpl.html',
    }, {
      displayName : '',
      field : 'actions',
      width : 25,
      cellTemplate : 'modules/stock/exit/templates/actions.tmpl.html',
    }],
    data : vm.stockForm.store.data,

    // fastWatch to false is required for updating the grid correctly for
    // inventories loaded from an invoice for patient exit
    fastWatch : false,
    flatEntityAccess : true,
    showGridFooter : true,
    gridFooterTemplate,
    onRegisterApi,
  };

  // exposing the grid options to the view
  vm.gridOptions = gridOptions;

  const exportation = new GridExportService(vm.gridOptions);

  // runs validation and updates the messages for the user
  vm.validate = () => {
    vm.stockForm.validate();
    vm.messages = vm.stockForm.messages();
  };

  vm.setDepot = function setDepot(depot) {
    vm.enablePackaging = false;
    const column = vm.gridOptions.columnDefs.find(col => col.field === 'packaging');

    if (depot.is_count_per_container && vm.stockSettings.enable_packaging_pharmaceutical_products) {
      vm.enablePackaging = true;
    }

    column.visible = vm.enablePackaging;
    vm.gridApi.grid.refresh();

    vm.stockForm.setDepot(depot);
    vm.validate();
  };

  vm.configureItem = function configureItem(row, lot) {
    vm.stockForm.configureItem(row, lot);
    vm.validate();
  };

  //
  vm.setLotFromDropdown = function setLotFromDropdown(row, lot) {
    vm.stockForm._pool.use(lot.lot_uuid);
    row.configure(lot);
    vm.stockForm.updateLotListings(row.inventory_uuid);
    vm.validate();
  };

  vm.removeItem = function removeItem(uuid) {
    vm.stockForm.removeItem(uuid);
    vm.validate();
  };

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

        vm.validate();
      })
      .catch(Notify.handleError);
  }

  /**
   * @function exportGrid
   * @description export the content of the grid to csv.
   */
  vm.exportGrid = () => {
    exportation.exportToCsv('Stock_Exit_', exportation.defaultColumnFormatter, vm.stockForm.formatRowsForExport);
  };

  /**
   *
   * @param gridApi
   */
  function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  }

  //
  /**
   *
   * @param exitType
   * @param entity
   */
  function onSelectExitType(exitType, entity) {
    vm.stockForm.details.description = null;
    vm.selectedExitType = exitType;
    vm.stockForm.setExitType(exitType.label);

    if (entity.shipment) {
      vm.stockForm.details.description = entity.shipment.description;
    }

    switch (exitType.label) {
    case 'patient':
      vm.stockForm.setPatientDistribution(entity);
      break;
    case 'service':
      vm.stockForm.setServiceDistribution(entity);
      break;
    case 'depot':
      vm.stockForm.setDepotDistribution(entity);
      break;
    case 'loss':
      vm.stockForm.setLossDistribution();
      break;
    default:
      break;
    }

    // only allow expired stock if we are exiting to stock loss
    if (exitType.label === 'loss') {
      vm.stockForm.setAllowExpired(true);
    } else {
      vm.stockForm.setAllowExpired(false);
    }

    vm.validate();
  }

  vm.setDate = function setDate(date) {
    vm.stockForm.setDate(date);
    vm.validate();
  };

  vm.clear = function clear() {
    vm.stockForm.clear();
    vm.validate();
  };

  /**
   *
   */
  function startup() {
    // setting params for grid loading state
    vm.hasError = false;

    vm.stockForm.setup();

    // Handle startups from a shipment
    if (params.shipment) {
      vm.loading = true;

      Shipments.readAll(params.shipment)
        .then(shipment => {
          vm.shipment = shipment;
          return Depot.read(vm.shipment.origin_depot_uuid);
        })
        .then(originDepot => {
          vm.setDepot(originDepot);
          return Depot.read(vm.shipment.destination_depot_uuid);
        })
        .then(destDepot => {
          destDepot.shipment = vm.shipment;
          const depotExitType = ExitTypes.exitTypes.find(item => item.label === 'depot');
          onSelectExitType(depotExitType, destDepot);
          vm.destLabel = depotExitType.formatLabel(destDepot);
        })
        .catch(Notify.handleError)
        .finally(() => {
          vm.loading = false;
        });
    }

    vm.validate();
  }

  vm.addItems = function addItems(numItems) {
    vm.stockForm.addItems(numItems);
    vm.validate();
  };

  vm.getLotByBarcode = function getLotByBarcode() {
    Barcode.modal({ shouldSearch : false })
      .then(record => {
        if (record.uuid) {
          vm.stockForm.addLotByBarcode(record.uuid);
          vm.messages = vm.stockForm.messages();
        }
      });
  };

  /**
   * @param row
   * @function errorLineHighlight
   * @description
   * Sets the grid's error flag on the row to render a red highlight
   * on the row.
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
    if (form.$invalid) { return null; }

    // run validation
    vm.validate();

    const isValidForSubmission = vm.stockForm.validate();

    // check if the form is valid
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

    const renderReceipt = ReceiptModal.getReceiptFnByFluxId(vm.stockForm.details.flux_id);

    const shipmentReady = vm.stockForm.details.isExit === true
      && vm.stockForm.details.from_depot
      && vm.stockForm.details.to_depot;

    if (vm.stockForm.details.shipment_uuid && !shipmentReady) {
      Notify.warn('Shipment Incorrect Data');
      return null;
    }

    return vm.stockForm.submit()
      .then(result => renderReceipt(result.uuid, true))
      .then(() => {
        if (($transition$.from().name === 'shipments') && !!params.shipment) {
          $state.go('shipments');
        }
        vm.stockForm.clear();
        vm.validate();
      })
      .catch(Notify.handleError);
  }

  startup();
}
