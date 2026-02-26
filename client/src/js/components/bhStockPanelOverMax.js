angular.module('bhima.components')
  .component('bhStockPanelOverMax', {
    templateUrl : 'modules/templates/bhStockPanelOverMax.tmpl.html',
    controller  : StockPanelOverMaxController,
    bindings    : {
      label   : '@?',
    },
  });

StockPanelOverMaxController.$inject = [
  'StockDashboardService', 'NotifyService',
];

/**
 * Stock Panel Over Max Controller
 * @param StockDashboard
 * @param Notify
 */
function StockPanelOverMaxController(StockDashboard, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.loading = true;
    $ctrl.display = 'fa fa-minus-square text-info';

    StockDashboard.read({ status : 'over_max' })
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
              key : 'status', value : 'over_maximum',
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
