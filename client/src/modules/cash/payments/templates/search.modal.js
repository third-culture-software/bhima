angular.module('bhima.controllers')
  .controller('SearchCashPaymentModalController', SearchCashPaymentModalController);

SearchCashPaymentModalController.$inject = [
  '$uibModalInstance', 'filters', 'Store', 'PeriodService',
  'util', 'CashService', 'SearchModalUtilService',
];

/**
 * Search Cash Payment controller
 * @param Instance
 * @param filters
 * @param Store
 * @param Periods
 * @param util
 * @param Cash
 * @param SearchModal
 * @description
 * This controller powers the Cash Search modal.  Cash filters are passed in from the registry as
 * POJO and are attached to the view.  They are modified here and returned to the parent controller
 * as a POJO.
 */
function SearchCashPaymentModalController(Instance, filters, Store, Periods, util, Cash, SearchModal) {
  const vm = this;
  const changes = new Store({ identifier : 'key' });

  const searchQueryOptions = [
    'is_caution', 'reference', 'cashbox_id', 'user_id', 'reference_patient',
    'currency_id', 'reversed', 'debtor_group_uuid', 'description', 'project_id',
  ];

  vm.searchQueries = {};
  vm.defaultQueries = {};

  // displayValues will be an id:displayValue pair
  const displayValues = {};
  const lastDisplayValues = Cash.filters.getDisplayValueMap();

  // assign already defined custom filters to searchQueries object
  vm.searchQueries = util.maskObjectFromKeys(filters, searchQueryOptions);

  // assign default filters
  if (filters.limit) {
    vm.defaultQueries.limit = filters.limit;
  }

  vm.cancel = Instance.close;

  // Set up page elements data (debtor select data)
  vm.onSelectDebtor = onSelectDebtor;

  /**
   *
   * @param debtorGroup
   */
  function onSelectDebtor(debtorGroup) {
    displayValues.debtor_group_uuid = debtorGroup.name;
    vm.searchQueries.debtor_group_uuid = debtorGroup.uuid;
  }

  vm.onSelectProject = (project) => {
    displayValues.project_id = project.name;
    vm.searchQueries.project_id = project.id;
  };

  // custom filter user_id - assign the value to the searchQueries object
  vm.onSelectUser = function onSelectUser(user) {
    displayValues.user_id = user.display_name;
    vm.searchQueries.user_id = user.id;
  };

  // custom filter cashbox_id - assign the value to the searchQueries object
  vm.onSelectCashbox = function onSelectCashbox(cashbox) {
    displayValues.cashbox_id = cashbox.hrlabel;
    vm.searchQueries.cashbox_id = cashbox.id;
  };

  // on caution change
  vm.onCautionChange = value => {
    vm.searchQueries.is_caution = value;
  };

  vm.setCurrency = function setCurrency(currency) {
    vm.searchQueries.currency_id = currency.id;
    displayValues.currency_id = currency.label;
  };

  // default filter period - directly write to changes list
  vm.onSelectPeriod = function onSelectPeriod(period) {
    const periodFilters = Periods.processFilterChanges(period);

    periodFilters.forEach(filterChange => {
      changes.post(filterChange);
    });
  };

  // default filter limit - directly write to changes list
  vm.onSelectLimit = function onSelectLimit(value) {
    // input is type value, this will only be defined for a valid number
    if (angular.isDefined(value)) {
      changes.post({ key : 'limit', value });
    }
  };

  // deletes a filter from the custom filter object, this key will no longer be written to changes on exit
  vm.clear = function clear(key) {
    delete vm.searchQueries[key];
  };

  // returns the filters to the journal to be used to refresh the page
  vm.submit = function submit() {
    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);
    return Instance.close(loggedChanges);
  };
}
