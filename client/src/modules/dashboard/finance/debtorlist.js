angular.module('bhima.controllers')
  .controller('DebtorListDashboardController', DebtorListDashboardController);

DebtorListDashboardController.$inject = [
  'FinanceDashboardService', 'appcache',
];

function DebtorListDashboardController(Finance, AppCache) {
  const self = this;
  const cache = new AppCache('DebtorFinanceDashboard');

  // toggle loading state
  self.isLoading = true;

  // limits
  self.limits = Finance.limits;
  self.limit = 10;

  // load data
  Finance.getTopDebtors()
    .then((response) => {
      self.isLoading = false;
      self.data = response.data;
    });

  self.saveOptions = () => { cache.put('options', { limit : self.limit }); };

  function loadDefaultOptions() {
    cache.fetch('options')
      .then((options) => {
        if (!options) { return; }
        self.limit = options.limit;
      });
  }

  // load defaults
  loadDefaultOptions();
}
