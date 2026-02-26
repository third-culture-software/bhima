angular.module('bhima.components')
  .component('bhStockPanelOutOfStock', {
    templateUrl : 'modules/templates/bhStockPanelOutOfStock.tmpl.html',
    controller  : StockPanelOutOfStockController,
    bindings    : {
      label   : '@?',
    },
  });

StockPanelOutOfStockController.$inject = [
  'StockDashboardService', 'NotifyService',
];

/**
 * Stock Panel Out Of Stock Controller
 * @param StockDashboard
 * @param Notify
 */
function StockPanelOutOfStockController(StockDashboard, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.loading = true;

    StockDashboard.read({ status : 'out_of_stock' })
      .then((data) => {
        $ctrl.loading = false;
        $ctrl.stockNotFound = !data.length;

        data.forEach(element => {
          element.ahref = `stockInventories({ filters : [
            { key : 'period', value : 'allTime'},
            { key : 'includeEmptyLot', value : 1 },
            { key           : 'depot_uuid',
              value         : '${element.depot_uuid}',
              displayValue  : '${element.depot_text}',
              cacheable     : false },
            {
              key : 'status', value : 'stock_out',
              displayValue : '${$ctrl.label}',
              cacheable : false
            }
          ]})`;
        });

        $ctrl.data = data;
      })
      .catch(Notify.handleError);
  };
}
