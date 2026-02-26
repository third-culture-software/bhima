angular.module('bhima.controllers')
  .controller('StaffDashboardController', StaffDashboardController);

StaffDashboardController.$inject = [
  'IndicatorsDashboardService', 'NotifyService',
];

/**
 *
 * @param IndicatorsDashboard
 * @param Notify
 */
function StaffDashboardController(IndicatorsDashboard, Notify) {
  const vm = this;
  const current = new Date();
  const year = current.getFullYear();
  vm.search = { date : current };
  vm.selected = { dateFrom : new Date(`${year}-01-01`), dateTo : new Date(`${year}-12-31`) };

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
        vm.indicators = data.indicators.staff;
        vm.periodicIndicators = data.periodicIndicators.staff;
      })
      .catch(Notify.errorHandler);
  }

  load(vm.selected);
}
