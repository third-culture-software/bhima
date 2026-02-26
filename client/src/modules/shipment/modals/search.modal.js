angular.module('bhima.controllers')
  .controller('SearchShipmentModalController', SearchShipmentModalController);

// dependencies injections
SearchShipmentModalController.$inject = [
  'data', '$uibModalInstance', '$translate', 'Store', 'PeriodService', 'util',
  'ShipmentService', 'ShipmentFilter', 'SearchModalUtilService',
];

/**
 *
 * @param data
 * @param Instance
 * @param $translate
 * @param Store
 * @param Periods
 * @param util
 * @param Shipment
 * @param ShipmentFilter
 * @param SearchModal
 */
function SearchShipmentModalController(
  data, Instance, $translate, Store, Periods, util, Shipment, ShipmentFilter, SearchModal,
) {
  const vm = this;
  const changes = new Store({ identifier : 'key' });
  const searchQueryOptions = [
    'origin_depot_uuid', 'destination_depot_uuid',
    'status', 'reference',
  ];
  const displayValues = {};
  const shipmentFilter = new ShipmentFilter();

  vm.filters = data;
  vm.searchQueries = {};
  vm.defaultQueries = {};

  vm.onSelectPeriod = (period) => {
    const periodFilters = Periods.processFilterChanges(period);

    periodFilters.forEach((filterChange) => {
      changes.post(filterChange);
    });
  };

  const lastViewFilters = shipmentFilter.formatView().customFilters;

  // map key to last display value for lookup in loggedChange
  const lastDisplayValues = lastViewFilters.reduce((object, filter) => {
    object[filter._key] = filter.displayValue;
    return object;
  }, {});

  // custom filter depot_uuid - assign the value to the params object
  vm.onSelectDepot = (depot) => {
    vm.searchQueries.origin_depot_uuid = depot.uuid;
    displayValues.origin_depot_uuid = depot.text;
  };
  vm.onSelectDestinationDepot = (depot) => {
    vm.searchQueries.destination_depot_uuid = depot.uuid;
    displayValues.destination_depot_uuid = depot.text;
  };

  // default filter limit - directly write to changes list
  vm.onSelectLimit = (value) => {
    // input is type value, this will only be defined for a valid number
    if (angular.isDefined(value)) {
      changes.post({ key : 'limit', value });
    }
  };

  vm.onSelectProject = (project) => {
    displayValues.project_id = project.name;
    vm.searchQueries.project_id = project.id;
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

  vm.cancel = function cancel() { Instance.close(); };

  vm.submit = function submit() {
    // Set the label of status Value
    if (vm.searchQueries.status) {
      const status = $translate.instant(Shipment.statusLabel[vm.searchQueries.status]);
      displayValues.status = status;
    }

    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);
    return Instance.close(loggedChanges);
  };

}
