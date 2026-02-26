angular.module('bhima.components')
  .component('bhStockPanelMinimumReached', {
    templateUrl : 'modules/templates/bhStockPanelMinimumReached.tmpl.html',
    controller  : StockPanelMinimumReachedController,
    bindings    : {
      label   : '@?',
    },
  });

StockPanelMinimumReachedController.$inject = [
  'StockDashboardService', 'NotifyService',
];

/**
 * Stock Panel Minimum Reached Controller
 * @param StockDashboard
 * @param Notify
 */
function StockPanelMinimumReachedController(StockDashboard, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.loading = true;
    $ctrl.display = 'fa fa-battery-quarter text-info';

    StockDashboard.read({ status : 'minimum_reached' })
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
              key : 'status', value : 'minimum_reached',
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
