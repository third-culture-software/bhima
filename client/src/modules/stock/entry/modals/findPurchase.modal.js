angular.module('bhima.controllers')
  .controller('StockFindPurchaseModalController', StockFindPurchaseModalController);

StockFindPurchaseModalController.$inject = [
  '$uibModalInstance', 'PurchaseOrderService', 'NotifyService',
  'uiGridConstants', 'GridFilteringService', 'bhConstants', 'SessionService',
  'ExchangeRateService',
];

/**
 *
 * @param Instance
 * @param Purchase
 * @param Notify
 * @param uiGridConstants
 * @param Filtering
 * @param bhConstants
 * @param Session
 * @param Exchange
 */
function StockFindPurchaseModalController(
  Instance, Purchase, Notify, uiGridConstants, Filtering,
  bhConstants, Session, Exchange,
) {
  const vm = this;

  const {
    CONFIRMED,
    PARTIALLY_RECEIVED,
  } = bhConstants.purchaseStatus;

  /* ======================= Grid configurations ============================ */
  vm.gridOptions = { appScopeProvider : vm };

  const filtering = new Filtering(vm.gridOptions);

  const purchaseReferenceCellTemplate = `
    <div class="ui-grid-cell-contents">
      <bh-receipt value="row.entity.uuid" display-value="row.entity.reference" type="purchase">
    </div>
    `;
  const columns = [
    {
      field            : 'reference',
      displayName      : 'TABLE.COLUMNS.REFERENCE',
      headerCellFilter : 'translate',
      cellTemplate     : purchaseReferenceCellTemplate,
    }, {
      field            : 'date',
      cellFilter       : `date:"${bhConstants.dates.format}"`,
      filter           : { condition : filtering.filterByDate },
      displayName      : 'TABLE.COLUMNS.DATE',
      headerCellFilter : 'translate',
      sort             : { priority : 0, direction : 'desc' },
    }, {
      field            : 'supplier',
      displayName      : 'FORM.LABELS.SUPPLIER',
      headerCellFilter : 'translate',
    }, {
      field            : 'total_cost',
      displayName      : 'STOCK.AMOUNT',
      headerCellFilter : 'translate',
      cellFilter       : `currency:row.entity.currency_id`,
      cellClass        : 'text-right',
      type             : 'number',
    }, {
      field            : 'author',
      displayName      : 'TABLE.COLUMNS.BY',
      headerCellFilter : 'translate',
    },
  ];

  vm.gridOptions.columnDefs = columns;
  vm.gridOptions.multiSelect = false;
  vm.gridOptions.enableColumnMenus = false;
  vm.gridOptions.enableFiltering = false;
  vm.gridOptions.onRegisterApi = onRegisterApi;
  vm.toggleFilter = toggleFilter;

  // bind methods
  vm.submit = submit;
  vm.cancel = cancel;

  /**
   *
   * @param gridApi
   */
  function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  }

  /** toggle filter */
  function toggleFilter() {
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  /* ======================= End Grid ======================================== */
  /**
   *
   */
  function load() {
    vm.loading = true;
    Exchange.read()
      .then(() => Purchase.search({ status_id : [CONFIRMED, PARTIALLY_RECEIVED] }))
      .then(purchases => {
        purchases.forEach(p => {
          p.total_cost = p.cost + p.shipping_handling;
        });
        vm.gridOptions.data = purchases;
      })
      .catch(() => {
        vm.hasError = true;
      })
      .finally(() => {
        vm.loading = false;
      });
  }

  /**
   *
   */
  function submit() {
    const [selectedRow] = vm.gridApi.selection.getSelectedRows();

    if (!selectedRow || (selectedRow && !selectedRow.uuid)) { return null; }

    return Purchase.stockBalance(selectedRow.uuid)
      .then(handlePurchaseInformation)
      .catch(Notify.handleError);
  }

  // display the supplier name
  /**
   *
   * @param purchases
   */
  function handlePurchaseInformation(purchases) {
    purchases.forEach(purchase => {
      purchase.display_name = purchase.supplier_name;
    });

    return Instance.close(purchases);
  }

  // cancel
  /**
   *
   */
  function cancel() {
    Instance.close();
  }

  load();
}
