angular.module('bhima.controllers')
  .controller('PurchaseOrderAnalysisModalController', PurchaseOrderAnalysisModalController);

PurchaseOrderAnalysisModalController.$inject = [
  'Store', 'InventoryService', 'NotifyService',
  '$uibModalInstance', 'StockService', 'ReceiptModal', 'data',
  'PurchaseOrderService', '$uibModalInstance', 'bhConstants',
  '$translate',
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
function PurchaseOrderAnalysisModalController(Store, Inventories, Notify, Modal, Stock, Receipts, data,
  Purchases, Instance, bhConstants, $translate,
) {
  const vm = this;
  vm.isCreateState = true;
  vm.requistionReference = '';
  vm.purchaseItems = [];

  // expose to view
  vm.close = Instance.close;

  const store = new Store({ data : [] });
  const columns = [
    {
      field            : 'text',
      displayName      : 'FORM.LABELS.ARTICLES',
      headerCellFilter : 'translate',
      cellTemplate     : 'modules/stock/inventories/templates/inventory.cell.html',
    }, {
      field            : 'quantity',
      displayName      : 'STOCK.ANALYSIS.STOCK_QTY',
      headerCellFilter : 'translate',
      width            : '20%',
      cellClass        : 'text-right',
      type : 'number',
    }, {
      field            : 'status_translated',
      displayName      : 'STOCK.STATUS.LABEL',
      headerCellFilter : 'translate',
      width            : '20%',
      cellTemplate     : 'modules/stock/inventories/templates/status.cell.html',
    },
    {
      field            : 'quantity_ordered',
      displayName      : 'STOCK.ANALYSIS.ORDER_QTY',
      headerCellFilter : 'translate',
      width            : '20%',
      cellClass        : 'text-right',
      type : 'number',
    }, {
      field            : 'S_Q',
      displayName      : 'STOCK.ANALYSIS.OPT_QTY',
      headerTooltip    : 'STOCK.REFILL_QUANTITY',
      headerCellFilter : 'translate',
      width            : '20%',
      enableFiltering  : false,
      enableSorting    : true,
      type             : 'number',
      cellClass        : 'text-right',
      cellTemplate     : 'modules/stock/inventories/templates/appro.cell.html',
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


  vm.onSelectDepot = depot => {
    vm.depot_uuid = depot.uuid;

    const filters = {
      includeEmptyLot : 1,
      period : 'allTime',
      depot_uuid : depot.uuid,
      purchase_analyse_uuid : vm.analysis.uuid,
      limit : 1000000,
    };

    Stock.inventories.read(null, filters)
      .then(rows => {
        console.log('HVRRRRRRRRRRRRRR');
        console.log(rows);
        const dataPurchasesAnalised = [];

        // set status flags
        vm.purchaseItems.forEach(item => {


          let purchaseItem = {
            text : item.text,
            quantity : '---',
            status_translated : '---',
            quantity_ordered : item.quantity,
            S_Q : '---',
          };

          rows.forEach(row => {
            setStatusFlag(row);
            row.status_translated = $translate.instant(Stock.statusLabelMap(row.status));
            row.unit_type = $translate.instant(row.unit_type);

            if (item.inventory_uuid === row.inventory_uuid) {
              purchaseItem = row;
              purchaseItem.quantity_ordered = item.quantity;
            }
          });
          
          dataPurchasesAnalised.push(purchaseItem);
        });

        vm.gridOptions.data = dataPurchasesAnalised;

      })
      .catch(Notify.handleError);

  };

  /**
   *
   */
  function startup() {
    vm.analysis = data;

    Purchases.read(vm.analysis.uuid)
      .then(purchase => {
        vm.purchaseItems = purchase.items;
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param item
   */
  function setStatusFlag(item) {

    item.noAlert = !item.hasRiskyLots && !item.hasNearExpireLots && !item.hasExpiredLots;
    item.alert = item.hasExpiredLots;
    item.warning = !item.hasExpiredLots && (item.hasNearExpireLots || item.hasRiskyLots);

    item.hasStockOut = item.status === bhConstants.stockStatus.IS_STOCK_OUT;
    item.isInStock = item.status === bhConstants.stockStatus.IS_IN_STOCK;
    item.hasSecurityWarning = item.status === bhConstants.stockStatus.HAS_SECURITY_WARNING;
    item.hasMinimumWarning = item.status === bhConstants.stockStatus.HAS_MINIMUM_WARNING;
    item.hasOverageWarning = item.status === bhConstants.stockStatus.HAS_OVERAGE_WARNING;
    item.isUnusedStock = item.status === bhConstants.stockStatus.UNUSED_STOCK;
  }

  startup();
}
