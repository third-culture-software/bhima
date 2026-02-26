angular.module('bhima.controllers')
  .controller('AssetScansSearchModalController', AssetScansSearchModalController);

// dependencies injections
AssetScansSearchModalController.$inject = [
  'data', 'util', 'Store', '$uibModalInstance', 'StockService', 'SearchModalUtilService', 'PeriodService',
];

/**
 *
 * @param data
 * @param util
 * @param Store
 * @param Instance
 * @param Stock
 * @param SearchModal
 * @param Periods
 */
function AssetScansSearchModalController(data, util, Store, Instance, Stock, SearchModal, Periods) {
  const vm = this;
  const changes = new Store({ identifier : 'key' });

  vm.filters = data;
  vm.searchQueries = {};
  vm.defaultQueries = {};

  const searchQueryOptions = [
    'depot_uuid', 'inventory_uuid', 'group_uuid', 'assigned_to_uuid',
    'asset_label', 'reference_number', 'show_only_last_scans',
  ];

  // displayValues will be an id:displayValue pair
  const displayValues = {};
  const lastDisplayValues = Stock.filter.lot.getDisplayValueMap();

  // assign already defined custom filters to searchQueries object
  vm.searchQueries = util.maskObjectFromKeys(data, searchQueryOptions);

  // Set the excludeAssets flag based on the existing custom search filter
  vm.showOnlyLatestScan = 0;
  if ('show_only_last_scans' in vm.searchQueries && !vm.searchQueries.show_only_last_scans) {
    vm.showOnlyLatestScan = 1;
  }

  vm.cancel = Instance.close;

  // custom filter depot_uuid - assign the value to the params object
  vm.onSelectDepot = function onSelectDepot(depot) {
    vm.searchQueries.depot_uuid = depot.uuid;
    displayValues.depot_uuid = depot.text;
  };

  // custom filter inventory_uuid - assign the value to the params object
  vm.onSelectInventory = function onSelectInventory(inventory) {
    vm.searchQueries.inventory_uuid = inventory.uuid;
    displayValues.inventory_uuid = inventory.label;
  };

  // custom filter group_uuid - assign the value to the params object
  vm.onSelectGroup = (group) => {
    vm.searchQueries.group_uuid = group.uuid;
    displayValues.group_uuid = group.name;
  };

  vm.onSelectAssignedTo = function onSelectAssignedTo(entity) {
    vm.searchQueries.assigned_to_uuid = entity.uuid;
    displayValues.assigned_to_uuid = entity.display_name;
  };

  // custom filter - flag to only show the latests scan
  vm.onShowOnlyLatestScan = function onShowOnlyLatestScan() {
    if (vm.showOnlyLatestScan) {
      vm.searchQueries.show_only_last_scans = 1;
    } else {
      vm.clear('show_only_last_scans');
    }
  };

  // default filter limit - directly write to changes list
  vm.onSelectLimit = function onSelectLimit(value) {
    // input is type value, this will only be defined for a valid number
    if (angular.isDefined(value)) {
      changes.post({ key : 'limit', value });
    }
  };

  // default filter period - directly write to changes list
  vm.onSelectPeriod = function onSelectPeriod(period) {
    const periodFilters = Periods.processFilterChanges(period);

    periodFilters.forEach((filterChange) => {
      changes.post(filterChange);
    });
  };

  // deletes a filter from the custom filter object,
  // this key will no longer be written to changes on exit
  vm.clear = function clear(key) {
    delete vm.searchQueries[key];
  };

  if (data.limit) {
    vm.defaultQueries.limit = data.limit;
  }

  if (data.tags) {
    vm.defaultQueries.tags = data.tags.map(t => t.name).join(',');
  }

  vm.submit = () => {

    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);

    return Instance.close(loggedChanges);
  };
}
