angular.module('bhima.controllers')
  .controller('DuplicateLotsController', DuplicateLotsController);

DuplicateLotsController.$inject = [
  'LotService', 'NotifyService', 'StockModalService', 'SessionService',
  'GridColumnService', 'GridStateService', '$state', '$translate', 'bhConstants',
];

/**
 * Stock Lots Duplicates
 * This module is a stock lots page for finding and merging duplicate lots
 * @param Lots
 * @param Notify
 * @param Modal
 * @param Session
 * @param Columns
 * @param GridState
 * @param $state
 * @param $translate
 * @param bhConstants
 */
function DuplicateLotsController(
  Lots, Notify, Modal, Session,
  Columns, GridState, $state, $translate, bhConstants,
) {
  const vm = this;
  const cacheKey = 'duplicate-lots-grid';
  vm.enterprise = Session.enterprise;

  vm.bhConstants = bhConstants;

  const columns = [
    {
      field : 'inventory_code',
      displayName : 'TABLE.COLUMNS.CODE',
      headerTooltip : 'TABLE.COLUMNS.CODE',
      headerCellFilter : 'translate',
    }, {
      field : 'inventory_name',
      displayName : 'TABLE.COLUMNS.INVENTORY',
      headerTooltip : 'TABLE.COLUMNS.INVENTORY',
      headerCellFilter : 'translate',
      width : '20%',
    }, {
      field : 'label',
      displayName : 'TABLE.COLUMNS.LOT',
      headerTooltip : 'TABLE.COLUMNS.LOT',
      headerCellFilter : 'translate',
    }, {
      field : 'quantity_in_stock',
      displayName : 'STOCK.QUANTITY_IN_STOCK',
      headerTooltip : 'STOCK.QUANTITY_IN_STOCK',
      headerCellFilter : 'translate',
      cellClass : 'text-right',
      type : 'number',
    }, {
      field : 'unit_cost',
      displayName : 'TABLE.COLUMNS.UNIT_PRICE',
      headerTooltip : 'TABLE.COLUMNS.UNIT_PRICE',
      headerCellFilter : 'translate',
      cellFilter : `currency:${vm.enterprise.currency_id}`,
      cellClass : 'text-right',
      type : 'number',
    }, {
      field : 'expiration_date',
      displayName : 'STOCK.EXPIRATION_DATE',
      headerTooltip : 'STOCK.EXPIRATION_DATE',
      headerCellFilter : 'translate',
      cellClass : 'text-right',
      cellFilter : 'date',
      type : 'date',
    }, {
      field : 'num_duplicates',
      displayName : 'TABLE.COLUMNS.NUM_DUPLICATE_LOTS',
      headerTooltip : 'TABLE.COLUMNS.NUM_DUPLICATE_LOTS',
      headerCellFilter : 'translate',
      cellClass : 'text-right',
      type : 'number',
    }, {
      field : 'action',
      displayName : '',
      enableFiltering : false,
      enableSorting : false,
      cellTemplate : 'modules/stock/lots-duplicates/templates/action.cell.html',
    },
  ];

  const footerTemplate = `
    <div class="ui-grid-cell-contents">
      <b>{{ grid.appScope.gridOptions.data.length }}</b>
      <span translate>FORM.INFO.FOUND</span>
    </div>
  `;

  vm.gridOptions = {
    appScopeProvider   : vm,
    enableColumnMenus  : false,
    columnDefs         : columns,
    showGridFooter     : true,
    gridFooterTemplate : footerTemplate,
    fastWatch          : true,
    flatEntityAccess   : true,
  };

  const gridColumns = new Columns(vm.gridOptions, cacheKey);
  const state = new GridState(vm.gridOptions, cacheKey);

  vm.saveGridState = state.saveGridState;

  /**
   *
   */
  function clearGridState() {
    state.clearGridState();
    $state.reload();
  }

  // expose view logic
  vm.openColumnConfigModal = openColumnConfigModal;
  vm.clearGridState = clearGridState;

  // This function opens a modal through column service to let the user toggle
  // the visibility of the inventories registry's columns.
  /**
   *
   */
  function openColumnConfigModal() {
    gridColumns.openConfigurationModal();
  }

  // Call the server function to merge lots automatically
  /**
   *
   */
  function autoMergeLots() {
    vm.loading = true;
    Lots.autoMerge()
      .then((res) => {
        const msg = $translate.instant('LOTS.MERGED_LOTS_AUTOMATICALLY', res);
        vm.loading = false;
        load();
        Notify.success(msg);
      });
  }
  vm.autoMergeLots = autoMergeLots;

  // Call the server function to merge lot with zero quantity in stock
  /**
   *
   */
  function autoMergeZeroLots() {
    vm.loading = true;
    Lots.autoMergeZero()
      .then((res) => {
        const msg = $translate.instant('LOTS.MERGED_LOTS_AUTOMATICALLY', res);
        vm.loading = false;
        load();
        Notify.success(msg);
      });
  }
  vm.autoMergeZeroLots = autoMergeZeroLots;

  // load stock lots in the grid
  /**
   *
   */
  function load() {
    vm.hasError = false;
    vm.loading = true;

    Lots.allDupes()
      .then((rows) => {
        vm.gridOptions.data = rows;
      })
      .catch((err) => {
        vm.hasError = true;
        Notify.handleError(err);
      })
      .finally(() => {
        vm.loading = false;
      });
  }

  // lot duplicates modal
  vm.openDuplicatesModal = (uuid, depotUuid) => {
    // NOTE: depotUuid is undefined (for now)
    Modal.openDuplicateLotsModal({ uuid, depotUuid })
      .then((res) => {
        if (res === 'success') {
          // Reload the duplicate lots since some lots were merged
          load();
        }
      });
  };

  /**
   *
   */
  function startup() {
    load();
  }

  startup();
}
