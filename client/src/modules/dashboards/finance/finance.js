angular.module('bhima.controllers')
  .controller('FinanceDashboardController', FinanceDashboardController);

FinanceDashboardController.$inject = [
  'IndicatorsDashboardService', 'NotifyService', 'SessionService',
];

/**
 *
 * @param IndicatorsDashboard
 * @param Notify
 * @param Session
 */
function FinanceDashboardController(IndicatorsDashboard, Notify, Session) {
  const vm = this;
  const current = new Date();
  const year = current.getFullYear();
  vm.search = { date : current };
  vm.selected = { dateFrom : new Date(`${year}-01-01`), dateTo : new Date(`${year}-12-31`) };
  vm.enterprise = Session.enterprise;

  vm.onChangeFilter = selected => {
    if (selected.dateFrom) {
      vm.selected.dateFrom = selected.dateFrom;
    }

    if (selected.dateTo) {
      vm.selected.dateTo = selected.dateTo;
    }
    load(vm.selected);
  };

  /**
   *
   * @param options
   */
  function load(options) {
    IndicatorsDashboard.dashboards.read(null, options)
      .then(data => {
        vm.indicators = data.indicators.finance;
        vm.periodicIndicators = data.periodicIndicators.finance;
      })
      .catch(Notify.errorHandler);
  }

  load(vm.selected);
}
