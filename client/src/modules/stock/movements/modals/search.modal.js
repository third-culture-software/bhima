angular.module('bhima.controllers')
  .controller('SearchMovementsModalController', SearchMovementsModalController);

SearchMovementsModalController.$inject = [
  'data', '$uibModalInstance',
  'PeriodService', 'Store', 'util', 'StockService',
  'SearchModalUtilService', 'SessionService',
];

/**
 *
 * @param data
 * @param Instance
 * @param Periods
 * @param Store
 * @param util
 * @param Stock
 * @param SearchModal
 * @param Session
 */
function SearchMovementsModalController(data, Instance, Periods, Store, util, Stock, SearchModal, Session) {
  const vm = this;
  const displayValues = {};
  const changes = new Store({ identifier : 'key' });

  const searchQueryOptions = [
    'is_exit', 'depot_uuid', 'inventory_uuid', 'label', 'flux_id',
    'dateFrom', 'dateTo', 'user_id', 'patientReference', 'service_uuid', 'invoice_uuid',
    'stock_requisition_uuid', 'voucherReference',
  ];

  vm.hasAutoStockAccounting = Session.stock_settings.enable_auto_stock_accounting;

  vm.filters = data;
  vm.searchQueries = {};
  vm.defaultQueries = {};

  vm.onSelectInventory = function onSelectInventory(inventory) {
    vm.searchQueries.inventory_uuid = inventory.uuid;
    displayValues.inventory_uuid = inventory.label;
  };

  // default filter period - directly write to changes list
  vm.onSelectPeriod = function onSelectPeriod(period) {
    const periodFilters = Periods.processFilterChanges(period);

    periodFilters.forEach(filterChange => {
      changes.post(filterChange);
    });
  };

  // map key to last display value for lookup in loggedChange
  const lastDisplayValues = Stock.filter.movements.getDisplayValueMap();

  // custom filter depot_uuid - assign the value to the params object
  vm.onSelectDepot = function onSelectDepot(depot) {
    vm.searchQueries.depot_uuid = depot.uuid;
    displayValues.depot_uuid = depot.text;
  };

  // custom filter stock_requisition_uuid - assign the value to the params object
  vm.onSelectRequisition = function onSelectRequisition(requisition) {
    vm.searchQueries.stock_requisition_uuid = requisition.uuid;
    displayValues.stock_requisition_uuid = requisition.reference;
  };

  // Custom filter service_uuid - assign the value to the params object
  vm.onSelectService = service => {
    vm.searchQueries.service_uuid = service.uuid;
    displayValues.service_uuid = service.name;
  };

  // custom filter flux_id - assign the value to the searchQueries object
  vm.onFluxChange = function onFluxChange(fluxes) {
    const searchValue = fluxes.map(f => f.id);

    // concats with a comma, replaces last comma
    const displayValue = fluxes
      .reduce((aggstr, flux) => aggstr.concat(flux.plainText, ', '), '')
      .replace(/, $/i, '')
      .trim();

    vm.searchQueries.flux_id = searchValue;
    displayValues.flux_id = displayValue;
  };

  // custom filter user
  vm.onSelectUser = function onSelectUser(user) {
    vm.searchQueries.user_id = user.id;
    displayValues.user_id = user.display_name;
  };

  // assign already defined custom filters to searchQueries object
  vm.searchQueries = util.maskObjectFromKeys(data, searchQueryOptions);

  if (data.limit) {
    vm.defaultQueries.limit = data.limit;
  } else {
    vm.defaultQueries.limit = 100;
  }

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
    if (vm.searchQueries.is_exit) {
      vm.searchQueries.is_exit = Number(vm.searchQueries.is_exit);
    }

    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);

    return Instance.close(loggedChanges);
  };
}
