angular.module('bhima.controllers')
  .controller('DebtorGroupListDashboardController', DebtorGroupListDashboardController);

DebtorGroupListDashboardController.$inject = [
  'FinanceDashboardService', 'appcache',
];

function DebtorGroupListDashboardController(Finance, AppCache) {
  const self = this;
  const cache = new AppCache('DGFinanceDashboard');

  // toggle loading state
  self.isLoading = true;

  // limits
  self.limits = Finance.limits;
  self.limit = 10;

  // load list data
  Finance.getTopDebtorGroups()
    .then((response) => {
      self.isLoading = false;
      self.data = response.data;
    });

  self.saveOptions = () => {
    cache.put('options', { limit : self.limit });
  };

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
