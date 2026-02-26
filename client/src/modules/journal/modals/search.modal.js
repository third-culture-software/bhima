angular.module('bhima.controllers')
  .controller('JournalSearchModalController', JournalSearchModalController);

JournalSearchModalController.$inject = [
  '$uibModalInstance', 'NotifyService', 'Store', 'filters', 'options',
  'PeriodService', '$translate', 'util', 'TransactionTypeService',
  'JournalService', 'SearchModalUtilService',
];

/**
 *
 * @param Instance
 * @param Notify
 * @param Store
 * @param filters
 * @param options
 * @param Periods
 * @param $translate
 * @param util
 * @param TransactionTypes
 * @param Journal
 * @param SearchModal
 */
function JournalSearchModalController(
  Instance, Notify, Store, filters, options, Periods, $translate, util,
  TransactionTypes, Journal, SearchModal,
) {
  const vm = this;

  // displayValues will be an id:displayValue pair
  const displayValues = {};
  const lastDisplayValues = Journal.filters.getDisplayValueMap();

  // @TODO ideally these should be passed in when the modal is initialised
  //       these are known when the filter service is defined
  const searchQueryOptions = [
    'description', 'user_id', 'account_id', 'project_id', 'amount', 'trans_id',
    'transaction_type_id', 'includeNonPosted', 'hrRecord', 'hrEntity', 'comment',
    'hrReference', 'currency_id', 'showOnlyNullCostCenter', 'cost_center_id',
    'account_type_id',
  ];

  const changes = new Store({ identifier : 'key' });
  vm.filters = filters;
  vm.options = options;

  // an object to keep track of all custom filters, assigned in the view
  vm.searchQueries = {};
  vm.defaultQueries = {};
  // assign already defined custom filters to searchQueries object
  vm.searchQueries = util.maskObjectFromKeys(filters, searchQueryOptions);

  /**
   * hasDefaultAccount is used to set a default account selection behavior
   * if the search modal need to set account selection in default query panel we can send it
   * as parameters
   * @example
   * <pre>
   *   Config.openSearchModal(filters, { hasDefaultAccount : true })
   * </pre>
   */
  if (options.hasDefaultAccount) {
    vm.hasDefaultAccount = true;
  }

  // hide the posted toggle when not needed
  if (options.hidePostedOption) {
    vm.hidePostedOption = true;
  }

  // assign default filters
  if (filters.limit) {
    vm.defaultQueries.limit = filters.limit;
  }

  if (angular.isDefined(filters.showFullTransactions)) {
    vm.defaultQueries.showFullTransactions = filters.showFullTransactions;
  }

  // assign default account
  if (filters.account_id) {
    vm.defaultQueries.account_id = filters.account_id;
  }

  // load all Transaction types
  TransactionTypes.read()
    .then(types => {
      types.forEach(item => {
        item.typeText = $translate.instant(item.text);
      });
      vm.transactionTypes = types;
    })
    .catch(Notify.handleError);

  // handle component selection states
  // custom filter account_id - assign the value to the searchQueries object
  vm.onSelectAccount = function onSelectAccount(account) {
    vm.searchQueries.account_id = account.id;
    displayValues.account_id = String(account.number).concat(' - ', account.label);
  };

  vm.onSelectAccountTypeChange = type => {
    vm.searchQueries.account_type_id = type.id;
    displayValues.account_type_id = $translate.instant(type.translation_key);
  };

  // custom filter user_id - assign the value to the searchQueries object
  vm.onSelectUser = function onSelectUser(user) {
    vm.searchQueries.user_id = user.id;
    displayValues.user_id = user.display_name;
  };

  // custom filter project_id - assign the value to the searchQueries object
  vm.onSelectProject = function onSelectProject(project) {
    vm.searchQueries.project_id = project.id;
    displayValues.project_id = project.name;
  };

  // deafult filter period - directly write to changes list
  vm.onSelectPeriod = function onSelectPeriod(period) {
    const periodFilters = Periods.processFilterChanges(period);

    periodFilters.forEach(filterChange => {
      changes.post(filterChange);
    });
  };

  // custom filter transaction_type_id - assign the value to the searchQueries object
  vm.onTransactionTypesChange = function onTransactionTypesChange(transactionTypes) {
    vm.searchQueries.transaction_type_id = transactionTypes;
    const types = [];

    transactionTypes.forEach(typeId => {
      vm.transactionTypes.forEach(type => {
        if (typeId === type.id) {
          types.push(type.typeText);
        }
      });
    });

    displayValues.transaction_type_id = types.join(' / ');
  };

  vm.onCostCenterSelect = cc => {
    vm.searchQueries.cost_center_id = cc.id;
    displayValues.cost_center_id = cc.label;
  };

  // default filter limit - directly write to changes list
  vm.onSelectLimit = function onSelectLimit(value) {
    // input is type value, this will only be defined for a valid number
    if (angular.isDefined(value)) {
      changes.post({ key : 'limit', value });
    }
  };

  vm.onSetCurrency = (currency) => {
    vm.searchQueries.currency_id = currency.id;
    displayValues.currency_id = currency.label;
  };

  // default filter to show full transactions
  vm.toggleFullTransaction = function toggleFullTransaction(value) {
    if (angular.isDefined(value)) {
      changes.post({ key : 'showFullTransactions', value });
    }
  };

  // deletes a filter from the custom filter object, this key will no longer be written to changes on exit
  vm.clear = function clear(key) {
    delete vm.searchQueries[key];
  };

  vm.cancel = Instance.dismiss;

  // returns the filters to the journal to be used to refresh the page
  vm.submit = function submit(form) {
    if (form.$invalid) { return 0; }

    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);
    return Instance.close(loggedChanges);
  };
}
