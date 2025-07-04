angular.module('bhima.controllers')
  .controller('StockInventoryAdjustmentController', StockInventoryAdjustmentController);

// dependencies injections
StockInventoryAdjustmentController.$inject = [
  'NotifyService', 'SessionService', 'util',
  'bhConstants', 'ReceiptModal', 'StockFormService', 'StockService',
  'uiGridConstants',
];

/**
 * @class StockInventoryAdjustmentController
 *
 * @description
 * This module exists to make sure that existing stock can be adjusted entirely
 */
function StockInventoryAdjustmentController(
  Notify, Session, util, bhConstants, ReceiptModal, StockForm,
  Stock, uiGridConstants,
) {
  const vm = this;

  const { INVENTORY_ADJUSTMENT } = bhConstants.flux;

  // global variables
  vm.Stock = new StockForm('StockInventoryAdjustment');
  vm.movement = {};
  vm.stockOut = {};

  vm.currentInventories = [];
  vm.overconsumption = [];

  vm.onDateChange = date => {
    vm.movement.date = date;
    loadInventories(vm.depot);
    loadCurrentInventories(vm.depot);

    vm.overconsumption = [];
  };

  vm.onChangeDepot = depot => {
    vm.depot = depot;
    loadInventories(vm.depot);
    loadCurrentInventories(vm.depot);

    vm.overconsumption = [];
  };

  // bind constants
  vm.maxLength = util.maxLength;
  vm.maxDate = new Date();

  // bind methods
  vm.submit = submit;

  const expirationDateCellTemplate = `
    <div class="ui-grid-cell-contents"
      ng-class="{ 'bg-danger text-danger' : row.entity.isExpired }"
      title="{{row.entity.expiration_date | date }}">
      <span am-time-ago="row.entity.expiration_date"></span>
    </div>
  `;

  // grid columns
  const columns = [
    {
      field : 'status',
      width : 25,
      displayName : '',
      cellTemplate : 'modules/stock/exit/templates/status.tmpl.html',
      enableFiltering : false,
    }, {
      field : 'code',
      width : 120,
      displayName : 'TABLE.COLUMNS.CODE',
      headerCellFilter : 'translate',
    }, {
      field : 'text',
      displayName : 'TABLE.COLUMNS.DESCRIPTION',
      headerCellFilter : 'translate',
      enableSorting : true,
    }, {
      field : 'label',
      width : 150,
      displayName : 'TABLE.COLUMNS.LOT',
      headerCellFilter : 'translate',
      enableSorting : true,
    }, {
      field : 'old_quantity',
      width : 150,
      displayName : 'INVENTORY_ADJUSTMENT.OLD_QUANTITY',
      headerCellFilter : 'translate',
      enableFiltering : false,
      type : 'number',
    }, {
      field : 'quantity',
      width : 180,
      displayName : 'INVENTORY_ADJUSTMENT.NEW_QUANTITY',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/inventory-adjustment/templates/quantity.tmpl.html',
      aggregationType : uiGridConstants.aggregationTypes.sum,
      enableFiltering : false,
      type : 'number',
    }, {
      field : 'difference',
      width : 150,
      cellTemplate : 'modules/stock/inventory-adjustment/templates/difference.tmpl.html',
      displayName : 'INVENTORY_ADJUSTMENT.DIFFERENCE',
      headerCellFilter : 'translate',
      enableFiltering : false,
      enableSorting : true,
      type : 'number',
    },
    {
      field : 'expiration_date',
      width : 150,
      displayName : 'TABLE.COLUMNS.EXPIRATION_DATE',
      headerCellFilter : 'translate',
      cellTemplate : expirationDateCellTemplate,
      enableFiltering : false,
    },
  ];

  // grid options
  vm.gridOptions = {
    appScopeProvider : vm,
    enableSorting : true,
    enableColumnMenus : false,
    columnDefs : columns,
    data : vm.Stock.store.data,
    fastWatch : true,
    flatEntityAccess : true,
    rowTemplate : 'modules/templates/grid/error.row.html',
    onRegisterApi : onRegisterApiFn,
  };

  // register api
  function onRegisterApiFn(gridApi) {
    vm.gridApi = gridApi;
  }

  // inline filter
  vm.toggleInlineFilter = () => {
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  };

  function setupStock() {
    vm.Stock.setup();
    vm.Stock.store.clear();
  }

  function startup() {
    vm.movement = {
      date : new Date(),
    };

    setupStock();
  }

  // ============================ Inventories ==========================
  vm.reloadInventories = () => {
    loadInventories(vm.depot);
  };

  function loadInventories(depot) {
    vm.loading = true;
    setupStock();

    const today = new Date();

    Stock.lots.read(null, {
      depot_uuid : depot.uuid,
      includeEmptyLot : vm.includeEmptyLot || 0,
      dateTo : vm.movement.date,
      skipTags : true,
    })
      .then(lots => {

        // eslint-disable-next-line no-restricted-syntax
        for (const lot of lots) {
          const row = vm.Stock.addItems(1);

          row.configure(lot);

          Object.assign(row, {
            old_quantity : row.quantity,

            isExpired : (new Date(lot.expiration_date) < today),

            // overwrite the default validation function as it doesn't make sense in
            // this case.
            validate() { return this.quantity >= 0; },
          });
        }

        // run validation on all rows
        vm.Stock.validate();
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  function loadCurrentInventories(depot, dateTo = new Date()) {
    vm.loading = true;
    Stock.lots.read(null, { depot_uuid : depot.uuid, dateTo, skipTags : true })
      .then(lots => {
        vm.currentInventories = lots.filter(item => item.quantity > 0);
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  // ================================= Submit ================================
  function submit(form) {
    // check stock validity
    const isValid = vm.Stock.validate();

    if (!isValid || form.$invalid) { return 0; }

    const movement = {
      depot_uuid : vm.depot.uuid,
      date : vm.movement.date,
      description : vm.movement.description,
      is_exit : 0,
      flux_id : INVENTORY_ADJUSTMENT,
      user_id : Session.user.id,
    };

    const lots = vm.Stock.store.data.map((row) => {
      row.oldQuantity = row.old_quantity;
      return row;
    });

    const checkOverconsumption = vm.Stock.store.data;

    checkOverconsumption.forEach(stock => {
      stock.quantityAvailable = 0;

      vm.currentInventories.forEach(lot => {
        if (lot.uuid === stock.uuid) {
          stock.quantityAvailable = lot.quantity;
        }
      });
    });

    vm.overconsumption = checkOverconsumption.filter(c => (c.old_quantity - c.quantity) > c.quantityAvailable);

    if (vm.overconsumption.length) {
      vm.overconsumption.forEach(item => {
        item.textI18n = {
          text : item.text,
          label : item.label,
          old_quantity : item.old_quantity,
          quantityAvailable : item.quantityAvailable,
          quantity : item.quantity,
        };
      });

      Notify.danger('ERRORS.ER_PREVENT_NEGATIVE_QUANTITY_IN_ADJUSTMENT_STOCK');
      vm.loading = false;
      return 0;
    }

    movement.lots = lots.filter(lot => lot.quantity !== lot.oldQuantity);

    if (!movement.lots.length) {
      Notify.warn('INVENTORY_ADJUSTMENT.NO_CHANGE');
      return 0;
    }

    return Stock.inventoryAdjustment.create(movement)
      .then(document => {
        ReceiptModal.stockAdjustmentReceipt(document.uuid);

        startup();
        return loadInventories(vm.depot);
      })
      .then(() => {
        // reset error handling on the form
        form.$setPristine();
      })
      .catch(Notify.handleError);
  }

  startup();
}
