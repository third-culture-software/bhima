angular.module('bhima.controllers')
  .controller('SearchDepotModalController', SearchDepotModalController);

SearchDepotModalController.$inject = [
  'data', '$uibModalInstance', 'Store', 'util', 'StockService', 'SearchModalUtilService',
];

/**
 *
 * @param data
 * @param Instance
 * @param Store
 * @param util
 * @param Stock
 * @param SearchModal
 */
function SearchDepotModalController(data, Instance, Store, util, Stock, SearchModal) {
  const vm = this;
  const displayValues = {};
  const changes = new Store({ identifier : 'key' });

  const searchQueryOptions = ['text', 'is_warehouse'];

  vm.filters = data;

  vm.searchQueries = {};
  vm.defaultQueries = {};

  // map key to last display value for lookup in loggedChange
  const lastDisplayValues = Stock.filter.depot.getDisplayValueMap();

  // assign already defined custom filters to searchQueries object
  vm.searchQueries = util.maskObjectFromKeys(data, searchQueryOptions);

  if (data.limit) {
    vm.defaultQueries.limit = data.limit;
  }

  vm.onChangeIsWarehouse = value => {
    vm.searchQueries.is_warehouse = value;
  };

  // default filter limit - directly write to changes list
  vm.onSelectLimit = function onSelectLimit(_value) {
    // input is type value, this will only be defined for a valid number
    if (angular.isDefined(_value)) {
      changes.post({ key : 'limit', value : _value });
    }
  };

  // deletes a filter from the custom filter object,
  // this key will no longer be written to changes on exit
  vm.clear = function clear(key) {
    delete vm.searchQueries[key];
  };

  vm.cancel = function cancel() { Instance.close(); };

  vm.submit = () => {
    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);
    return Instance.close(loggedChanges);
  };
}
