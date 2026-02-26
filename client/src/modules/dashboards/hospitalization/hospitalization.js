angular.module('bhima.controllers')
  .controller('HospitalizationDashboardController', HospitalizationDashboardController);

HospitalizationDashboardController.$inject = [
  'IndicatorsDashboardService', 'NotifyService',
];

/**
 *
 * @param IndicatorsDashboard
 * @param Notify
 */
function HospitalizationDashboardController(IndicatorsDashboard, Notify) {
  const vm = this;
  const current = new Date();
  const year = current.getFullYear();
  vm.search = { date : current };
  vm.selected = { dateFrom : new Date(`${year}-01-01`), dateTo : new Date(`${year}-12-31`) };

  vm.onChangeFilter = selected => {

    if (selected.service === null) {
      delete vm.selected.service_uuid;
      delete vm.selected.service;
    }

    if (selected.service && selected.service.uuid) {
      vm.selected.service = selected.service;
      vm.selected.service_uuid = selected.service.uuid;
    }

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
        vm.indicators = data.indicators.hospitalization;
        vm.periodicIndicators = data.periodicIndicators.hospitalization;
      })
      .catch(Notify.errorHandler);
  }

  load(vm.selected);
}
