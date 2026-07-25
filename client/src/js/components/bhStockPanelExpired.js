angular.module('bhima.components')
  .component('bhStockPanelExpired', {
    templateUrl : 'modules/templates/bhStockPanelExpired.tmpl.html',
    controller  : StockPanelExpiredController,
    bindings    : {
      label   : '@?',
    },
  });

StockPanelExpiredController.$inject = [
  'StockDashboardService', 'NotifyService', '$state',
];

/**
 * Stock Panel Expired Controller
 * @param StockDashboard
 * @param Notify
 */
function StockPanelExpiredController(StockDashboard, Notify, $state) {
  const $ctrl = this;

  $ctrl.goToStockLots = function goToStockLots(depotUuid, depotText) {
    $state.go('stockLots', {
      filters : [
        { key : 'period', value : 'allTime' },
        { key : 'depot_uuid', value : depotUuid, displayValue : depotText, cacheable : false },
        { key : 'includeEmptyLot', value : 0 },
        { key : 'is_expired', value : 1, cacheable : false },
      ],
    });
  };

  $ctrl.$onInit = function onInit() {
    $ctrl.loading = true;
    $ctrl.display = 'fa fa-minus-circle icon-expired';

    StockDashboard.read({ status : 'expired' })
      .then((data) => {
        $ctrl.loading = false;
        $ctrl.stockNotFound = !data.length;
        $ctrl.data = data;
      })
      .catch(Notify.handleError);
  };
}
