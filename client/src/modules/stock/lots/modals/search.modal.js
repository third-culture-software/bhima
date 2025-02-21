angular.module('bhima.controllers')
  .controller('SearchLotsModalController', SearchLotsModalController);

// dependencies injections
SearchLotsModalController.$inject = [
  'data', 'util', 'Store', '$uibModalInstance', 'PeriodService', 'StockService',
  'SearchModalUtilService',
];

function SearchLotsModalController(data, util, Store, Instance, Periods, Stock, SearchModal) {
  const vm = this;
  const changes = new Store({ identifier : 'key' });

  vm.filters = data;
  vm.searchQueries = {};
  vm.defaultQueries = {};

  const searchQueryOptions = [
    'depot_uuid', 'inventory_uuid', 'group_uuid', 'label',
    'is_asset', 'reference_number',
    'entry_date_from', 'entry_date_to',
    'expiration_date_from', 'expiration_date_to',
    'is_expired', 'is_expiry_risk', 'tags', 'funding_source_uuid',
  ];

  // displayValues will be an id:displayValue pair
  const displayValues = {};
  const lastDisplayValues = Stock.filter.lot.getDisplayValueMap();

  // assign already defined custom filters to searchQueries object
  vm.searchQueries = util.maskObjectFromKeys(data, searchQueryOptions);

  // Set the excludeAssets flag based on the existing custom search filter
  vm.excludeAssets = 0;
  if ('is_asset' in vm.searchQueries && !vm.searchQueries.is_asset) {
    vm.excludeAssets = 1;
  }

  // default filter period - directly write to changes list
  vm.onSelectPeriod = function onSelectPeriod(period) {
    const periodFilters = Periods.processFilterChanges(period);

    periodFilters.forEach(filterChange => {
      changes.post(filterChange);
    });
  };

  // Hanlde the Funding Source
  vm.onSelectFundingSource = (fundingSource) => {
    vm.searchQueries.funding_source_uuid = fundingSource.uuid;
    displayValues.funding_source_uuid = fundingSource.label;
  };

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

  vm.onExcludeAssets = function onExcludeAssets() {
    if (vm.excludeAssets) {
      vm.searchQueries.is_asset = 0;
    } else {
      vm.clear('is_asset');
    }
  };

  // include/exclude empty lots
  vm.setIncludeEmptyLot = (value) => {
    vm.defaultQueries.includeEmptyLot = value;
    if (angular.isDefined(value)) {
      changes.post({ key : 'includeEmptyLot', value });
    }
  };

  // toggle expired stock
  vm.onToggleExpired = function onToggleExpired(bool) {
    vm.searchQueries.is_expired = bool;
  };

  // toggle expiry risks
  vm.onToggleExpiryRisk = function onToggleExpiryRisk(bool) {
    vm.searchQueries.is_expiry_risk = bool;
  };

  // default filter limit - directly write to changes list
  vm.onSelectLimit = function onSelectLimit(value) {
    // input is type value, this will only be defined for a valid number
    if (angular.isDefined(value)) {
      changes.post({ key : 'limit', value });
    }
  };

  // custom filter group_uuid - assign the value to the params object
  vm.onSelectGroup = (group) => {
    vm.searchQueries.group_uuid = group.uuid;
    displayValues.group_uuid = group.name;
  };

  // Save the expiration dates
  vm.onExpirationDate = (dateFrom, dateTo) => {
    vm.searchQueries.expiration_date_from = dateFrom;
    displayValues.expiration_date_from = dateFrom;
    vm.searchQueries.expiration_date_to = dateTo;
    displayValues.expiration_date_to = dateTo;
  };

  // Save the Tags
  vm.onSelectTags = tags => {
    vm.searchQueries.tags = tags;
    displayValues.tags = tags.map(t => t.name).join(',');
  };

  // deletes a filter from the custom filter object,
  // this key will no longer be written to changes on exit
  vm.clear = function clear(key) {
    delete vm.searchQueries[key];
  };

  if (data.includeEmptyLot) {
    vm.defaultQueries.includeEmptyLot = data.includeEmptyLot;
  } else {
    vm.defaultQueries.includeEmptyLot = 0;
  }

  if (data.limit) {
    vm.defaultQueries.limit = data.limit;
  }

  if (data.entry_date_from) {
    vm.defaultQueries.entry_date_from = data.entry_date_from;
  }
  if (data.entry_date_to) {
    vm.defaultQueries.entry_date_to = data.entry_date_to;
  }

  if (data.expiration_date_from) {
    vm.defaultQueries.expiration_date_from = data.expiration_date_from;
  }
  if (data.expiration_date_to) {
    vm.defaultQueries.expiration_date_to = data.expiration_date_to;
  }

  if (data.tags) {
    vm.defaultQueries.tags = data.tags.map(t => t.name).join(',');
  }

  vm.cancel = () => Instance.dismiss();

  vm.submit = () => {
    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);

    // The following work-around is necessary to deal with the case where you
    // select a tag but then delete it before clicking [Submit]; the element
    // has an empty array so it needs to be deleted. There probably is a
    // cleaner way to do this.
    // There may be a bug in bhTagSelect that is causing this problem.
    // @jmcameron 2021-01-08
    loggedChanges.some((elt, i) => {
      if (elt.key === 'tags') {
        if (elt.value.length === 0) {
          delete loggedChanges[i];
        }
      }
      return elt.key === 'tags';
    });

    return Instance.close(loggedChanges);
  };
}
