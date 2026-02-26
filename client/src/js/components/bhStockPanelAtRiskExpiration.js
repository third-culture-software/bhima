angular.module('bhima.components')
  .component('bhStockPanelAtRiskExpiration', {
    templateUrl : 'modules/templates/bhStockPanelAtRiskExpiration.tmpl.html',
    controller  : StockPanelAtRiskExpirationController,
    bindings    : {
      label   : '@?',
    },
  });

StockPanelAtRiskExpirationController.$inject = [
  'StockDashboardService', 'NotifyService',
];

/**
 * Stock Panel At Risk Expiration
 * @param StockDashboard
 * @param Notify
 */
function StockPanelAtRiskExpirationController(StockDashboard, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.loading = true;
    $ctrl.display = 'fa fa-exclamation-triangle icon-at-risk-of-expiring';

    StockDashboard.read({ status : 'at_risk_expiration' })
      .then((data) => {
        $ctrl.loading = false;
        $ctrl.stockNotFound = !data.length;

        data.forEach(element => {
          element.ahref = `stockLots({ filters : [
            { key : 'period', value : 'allTime'},
            { key : 'depot_uuid', value : '${element.depot_uuid}',
              displayValue: '${element.depot_text}',
              cacheable:false },
            { key : 'includeEmptyLot', value : 0 },
            { key : 'is_expiry_risk', value : 1, cacheable : false }
          ]})`;
        });

        $ctrl.data = data;
      })
      .catch(Notify.handleError);
  };
}
