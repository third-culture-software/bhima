angular.module('bhima.controllers')
  .controller('JournalSearchLogModalController', JournalSearchLogModalController);

JournalSearchLogModalController.$inject = [
  'data', '$uibModalInstance', 'Store', 'PeriodService',
  'util', 'JournalLogService', 'SearchModalUtilService',
];

/**
 *
 * @param data
 * @param Instance
 * @param Store
 * @param Periods
 * @param util
 * @param Journal
 * @param SearchModal
 */
function JournalSearchLogModalController(
  data, Instance, Store, Periods, util, Journal, SearchModal,
) {
  const vm = this;
  const displayValues = {};
  const changes = new Store({ identifier : 'key' });
  const searchQueryOptions = ['user_id', 'record_uuid', 'trans_id', 'hrRecord', 'description', 'action'];
  const lastDisplayValues = Journal.filters.getDisplayValueMap();

  vm.filters = data;
  vm.searchQueries = {};
  vm.defaultQueries = {};
  vm.searchQueries = util.maskObjectFromKeys(data, searchQueryOptions);

  if (data.limit) {
    vm.defaultQueries.limit = data.limit;
  }

  vm.onSelectPeriod = function onSelectPeriod(period) {
    const periodFilters = Periods.processFilterChanges(period);
    periodFilters.forEach(filterChange => {
      changes.post(filterChange);
    });
  };

  vm.onSelectLimit = function onSelectLimit(value) {
    if (angular.isDefined(value)) {
      changes.post({ key : 'limit', value });
    }
  };

  vm.onSelectUser = function onSelectUser(user) {
    vm.searchQueries.user_id = user.id;
    displayValues.user_id = user.display_name;
  };

  vm.onActionSelect = function onActionSelect(action) {
    vm.searchQueries.action = action;
    displayValues.action = action;
  };

  vm.clear = function clear(key) {
    delete vm.searchQueries[key];
  };

  vm.cancel = Instance.dismiss;

  vm.submit = function submit(form) {
    if (form.$invalid) { return 0; }

    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);
    return Instance.close(loggedChanges);
  };
}
