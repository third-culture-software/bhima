angular.module('bhima.components')
  .component('bhStockPanelRequirePurchaseOrder', {
    templateUrl : 'modules/templates/bhStockPanelRequirePurchaseOrder.tmpl.html',
    controller  : StockPanelRequirePurchaseOrderController,
    bindings    : {
      label   : '@?',
    },
  });

StockPanelRequirePurchaseOrderController.$inject = [
  'StockDashboardService', 'NotifyService',
];

/**
 * Stock Panel Require Purchase Order Controller
 * @param StockDashboard
 * @param Notify
 */
function StockPanelRequirePurchaseOrderController(StockDashboard, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.loading = true;
    $ctrl.display = 'fa fa-shopping-cart text-success';

    StockDashboard.read({ status : 'require_po' })
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
              key : 'require_po', value : 1,
              cacheable : false
            }
          ]})`;
        });

        $ctrl.data = data;
      })
      .catch(Notify.handleError);
  };
}
