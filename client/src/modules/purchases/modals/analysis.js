angular.module('bhima.controllers')
  .controller('PurchaseOrderAnalysisModalController', PurchaseOrderAnalysisModalController);

PurchaseOrderAnalysisModalController.$inject = [
   'NotifyService', '$uibModalInstance', 'StockService', 'ReceiptModal', 'data',
  'PurchaseOrderService', '$uibModalInstance', '$translate',  'uiGridConstants', '$state',
];

/**
 *
 * @param Notify
 * @param Modal
 * @param Stock
 * @param Receipts
 * @param data
 * @param Purchases
 * @param Instance
 * @param $translate
 * @param uiGridConstants
 * @param $state
 */
function PurchaseOrderAnalysisModalController(
  Notify, Modal, Stock, Receipts, data,
  Purchases, Instance, $translate, uiGridConstants, $state,
) {
  const vm = this;
  vm.purchaseItems = [];
  vm.editPurchase = editPurchase;
  vm.editStatusPurchase = editStatusPurchase;

  vm.loadingSuggest = false;

  // expose to view
  vm.close = Instance.close;

  const columns = [{
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
  }, {
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
  },{
    field            : 'quantity_ordered',
    displayName      : 'STOCK.ANALYSIS.ORDER_QTY',
    headerCellFilter : 'translate',
    width            : '20%',
    cellClass        : 'text-right',
    type : 'number',
  },{
    field            : 'purchase_price',
    displayName      : 'FORM.LABELS.UNIT_PRICE',
    headerCellFilter : 'translate',
    width            : '20%',
    cellClass        : 'text-right',
    cellFilter       : 'currency:row.entity.currency_id',
    type : 'number',
  }, {
    field            : 'purchase_total',
    displayName      : 'FORM.LABELS.TOTAL',
    headerCellFilter : 'translate',
    aggregationType  : uiGridConstants.aggregationTypes.sum,
    width            : '20%',
    cellClass        : 'text-right',
    cellFilter       : 'currency:row.entity.currency_id',
    type             : 'number',
    aggregationHideLabel : true,
  }];

  vm.gridOptions = {
    appScopeProvider : vm,
    enableColumnMenus : false,
    columnDefs : columns,
    showColumnFooter  : true,
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
    };

    toggleLoadingSuggest();

    Stock.inventories.read(null, filters)
      .then(rows => {
        const dataPurchasesAnalyzed = [];

        // set status flags
        vm.purchaseItems.forEach(item => {
          let purchaseItem = {
            text : item.text,
            quantity : '---',
            status_translated : '---',
            quantity_ordered : item.quantity,
            S_Q : '---',
            purchase_price : item.unit_price,
            purchase_total : item.total,
          };

          rows.forEach(row => {
            Stock.setStatusFlag(row);
            row.status_translated = $translate.instant(Stock.statusLabelMap(row.status));
            row.unit_type = $translate.instant(row.unit_type);

            if (item.inventory_uuid === row.inventory_uuid) {
              purchaseItem = row;
              purchaseItem.quantity_ordered = item.quantity;
              purchaseItem.purchase_price = item.unit_price;
              purchaseItem.purchase_total = item.total;
              purchaseItem.currency_id = vm.analysis.currency_id;
            }
          });
          
          dataPurchasesAnalyzed.push(purchaseItem);
        });

        vm.gridOptions.data = dataPurchasesAnalyzed;
      })
      .catch(Notify.handleError)
      .finally(toggleLoadingSuggest);
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
   */
  function toggleLoadingSuggest() {
    vm.loadingSuggest = !vm.loadingSuggest;
  }

  /**
   *
   */
  function editPurchase() {
    $state.go('purchasesUpdate', { uuid : vm.analysis.uuid });
    Modal.close(true);
  }

  /**
   *
   */
  function editStatusPurchase() {
    $state.go('purchasesRegistry', { purchase : vm.analysis });
    Modal.close(true);
  }

  startup();
}
