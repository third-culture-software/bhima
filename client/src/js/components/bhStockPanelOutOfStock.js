angular.module('bhima.components')
  .component('bhStockPanelOutOfStock', {
    templateUrl : 'modules/templates/bhStockPanelOutOfStock.tmpl.html',
    controller  : StockPanelOutOfStockController,
    bindings    : {
      label   : '@?',
    },
  });

StockPanelOutOfStockController.$inject = [
  'StockDashboardService', 'NotifyService', '$state',
];

/**
 * Stock Panel Out Of Stock Controller
 * @param StockDashboard
 * @param Notify
 */
function StockPanelOutOfStockController(StockDashboard, Notify, $state) {
  const $ctrl = this;

  $ctrl.goToStockInventories = function goToStockInventories(depotUuid, depotText) {
    $state.go('stockInventories', {
      filters : [
        { key : 'period', value : 'allTime' },
        { key : 'includeEmptyLot', value : 1 },
        { key : 'depot_uuid', value : depotUuid, displayValue : depotText, cacheable : false },
        { key : 'status', value : 'stock_out', displayValue : $ctrl.label, cacheable : false },
      ],
    });
  };

  $ctrl.$onInit = function onInit() {
    $ctrl.loading = true;

    StockDashboard.read({ status : 'out_of_stock' })
      .then((data) => {
        $ctrl.loading = false;
        $ctrl.stockNotFound = !data.length;
        $ctrl.data = data;
      })
      .catch(Notify.handleError);
  };
}
