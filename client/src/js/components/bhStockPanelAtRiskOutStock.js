angular.module('bhima.components')
  .component('bhStockPanelAtRiskOutStock', {
    templateUrl : 'modules/templates/bhStockPanelAtRiskOutStock.tmpl.html',
    controller  : StockPanelAtRiskOutStockController,
    bindings    : {
      label   : '@?',
    },
  });

StockPanelAtRiskOutStockController.$inject = [
  'StockDashboardService', 'NotifyService',
];

/**
 * Stock Panel At Risk Out Stock Controller
 * @param StockDashboard
 * @param Notify
 */
function StockPanelAtRiskOutStockController(StockDashboard, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.loading = true;
    $ctrl.display = 'fa fa-battery-quarter icon-out-of-stock';

    StockDashboard.read({ status : 'at_risk_out_stock' })
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
              key : 'status', value : 'security_reached',
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
