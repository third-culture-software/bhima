angular.module('bhima.controllers')
  .controller('SearchInventoriesModalController', SearchInventoriesModalController);

// dependencies injections
SearchInventoriesModalController.$inject = [
  'data', '$uibModalInstance', 'Store', 'PeriodService', 'util', 'StockService',
  'SearchModalUtilService',
];

/**
 *
 * @param data
 * @param Instance
 * @param Store
 * @param Periods
 * @param util
 * @param Stock
 * @param SearchModal
 */
function SearchInventoriesModalController(data, Instance, Store, Periods, util, Stock, SearchModal) {
  const vm = this;
  const changes = new Store({ identifier : 'key' });
  const searchQueryOptions = [
    'depot_uuid', 'inventory_uuid', 'status', 'require_po',
  ];

  vm.filters = data;
  vm.searchQueries = {};
  vm.defaultQueries = {};

  // displayValues will be an id:displayValue pair
  const displayValues = {};

  // default filter period - directly write to changes list
  vm.onSelectPeriod = (period) => {
    const periodFilters = Periods.processFilterChanges(period);

    periodFilters.forEach((filterChange) => {
      changes.post(filterChange);
    });
  };

  const lastViewFilters = Stock.filter.inventory.formatView().customFilters;

  // map key to last display value for lookup in loggedChange
  const lastDisplayValues = lastViewFilters.reduce((object, filter) => {
    object[filter._key] = filter.displayValue;
    return object;
  }, {});

  // custom filter depot_uuid - assign the value to the params object
  vm.onSelectDepot = (depot) => {
    vm.searchQueries.depot_uuid = depot.uuid;
    displayValues.depot_uuid = depot.text;
  };

  // custom filter group_uuid - assign the value to the params object
  vm.onSelectGroup = (group) => {
    vm.searchQueries.group_uuid = group.uuid;
    displayValues.group_uuid = group.name;
  };

  // custom filter inventory_uuid - assign the value to the params object
  vm.onSelectInventory = (inventory) => {
    vm.searchQueries.inventory_uuid = inventory.uuid;
    displayValues.inventory_uuid = inventory.label;
  };

  // default filter limit - directly write to changes list
  vm.onSelectLimit = (value) => {
    // input is type value, this will only be defined for a valid number
    if (angular.isDefined(value)) {
      changes.post({ key : 'limit', value });
    }
  };

  // include empty lots
  vm.setIncludeEmptyLot = (value) => {
    vm.defaultQueries.includeEmptyLot = value;
    if (angular.isDefined(value)) {
      changes.post({ key : 'includeEmptyLot', value });
    }
  };

  vm.showPendingTransfers = (value) => {
    vm.defaultQueries.showPendingTransfers = value;
    if (angular.isDefined(value)) {
      changes.post({ key : 'showPendingTransfers', value });
    }
  };

  vm.onSelectTags = tags => {
    vm.searchQueries.tags = tags;
    displayValues.tags = tags.map(t => t.name).join(',');
  };

  // deletes a filter from the custom filter object,
  // this key will no longer be written to changes on exit
  vm.clear = function clear(key) {
    delete vm.searchQueries[key];
  };

  // assign already defined custom filters to searchQueries object
  vm.searchQueries = util.maskObjectFromKeys(data, searchQueryOptions);

  if (data.limit) {
    vm.defaultQueries.limit = data.limit;
  }

  if (data.includeEmptyLot) {
    vm.defaultQueries.includeEmptyLot = data.includeEmptyLot;
  } else {
    vm.defaultQueries.includeEmptyLot = 0;
  }

  if (data.showPendingTransfers) {
    vm.defaultQueries.showPendingTransfers = data.showPendingTransfers;
  } else {
    vm.defaultQueries.showPendingTransfers = 0;
  }

  vm.cancel = function cancel() { Instance.close(); };

  vm.submit = function submit() {
    // Set the label of status Value
    if (vm.searchQueries.status) {
      displayValues.status = Stock.statusLabelMap(vm.searchQueries.status);
    }

    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);
    return Instance.close(loggedChanges);
  };

}
