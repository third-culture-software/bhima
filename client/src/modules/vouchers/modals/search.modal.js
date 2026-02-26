angular.module('bhima.controllers')
  .controller('VoucherRegistrySearchModalController', VoucherRegistrySearchModalController);

VoucherRegistrySearchModalController.$inject = [
  '$uibModalInstance', 'filters', 'NotifyService', 'PeriodService', 'Store',
  'util', 'VoucherService', 'TransactionTypeService', '$translate', 'SearchModalUtilService',
];

/**
 * @param ModalInstance
 * @param filters
 * @param Notify
 * @param Periods
 * @param Store
 * @param util
 * @param Vouchers
 * @param TransactionTypeService
 * @param $translate
 * @param SearchModal
 * @class VoucherRegistrySearchModalController
 * @description
 * This controller is responsible to collecting data from the search form and
 * returning it as a JSON object to the parent controller.  The data can be
 * preset by passing in a filters object using filtersProvider().
 */
function VoucherRegistrySearchModalController(
  ModalInstance, filters, Notify, Periods, Store, util, Vouchers,
  TransactionTypeService, $translate, SearchModal,
) {
  const vm = this;
  const changes = new Store({ identifier : 'key' });

  const searchQueryOptions = [
    'reference', 'description', 'user_id', 'type_ids', 'account_id', 'project_id', 'currency_id', 'reversed',
  ];

  // displayValues will be an id:displayValue pair
  const displayValues = {};
  const lastDisplayValues = Vouchers.filters.getDisplayValueMap();

  // searchQueries is the same id:value pair
  vm.searchQueries = {};
  vm.defaultQueries = {};

  // assign already defined custom filters to searchQueries object
  vm.searchQueries = util.maskObjectFromKeys(filters, searchQueryOptions);

  if (filters.limit) {
    vm.defaultQueries.limit = filters.limit;
  }

  TransactionTypeService.read()
    .then((tts) => {
      tts.forEach(item => {
        item.plainText = $translate.instant(item.text);
      });
      vm.transactionTypes = tts;
    })
    .catch(Notify.handleError);

  vm.onTransactionTypesChange = function onTransactionTypesChange(transactionTypes) {
    let typeText = '/';
    vm.searchQueries.type_ids = transactionTypes;

    transactionTypes.forEach((typeId) => {
      vm.transactionTypes.forEach(type => {
        if (typeId === type.id) {
          typeText += type.plainText.concat(' / ');
        }
      });
    });
    displayValues.type_ids = typeText;
  };

  // custom filter user_id - assign the value to the params object
  vm.onSelectUser = function onSelectUser(user) {
    vm.searchQueries.user_id = user.id;
    displayValues.user_id = user.display_name;
  };

  vm.onSelectProject = (project) => {
    displayValues.project_id = project.name;
    vm.searchQueries.project_id = project.id;
  };

  // default filter period - directly write to changes list
  vm.onSelectPeriod = function onSelectPeriod(period) {
    const periodFilters = Periods.processFilterChanges(period);

    periodFilters.forEach((filterChange) => {
      changes.post(filterChange);
    });
  };

  vm.setCurrency = function setCurrency(currency) {
    vm.searchQueries.currency_id = currency.id;
    displayValues.currency_id = currency.label;
  };

  // default filter limit - directly write to changes list
  vm.onSelectLimit = function onSelectLimit(_value) {
    // input is type value, this will only be defined for a valid number
    if (angular.isDefined(_value)) {
      changes.post({ key : 'limit', value : _value });
    }
  };

  // custom filter account_id - assign the value to the searchQueries object
  vm.onSelectAccount = function onSelectAccount(account) {
    vm.searchQueries.account_id = account.id;
    displayValues.account_id = String(account.number).concat(' - ', account.label);
  };

  // deletes a filter from the custom filter object, this key will no longer be written to changes on exit
  vm.clear = function clear(key) {
    delete vm.searchQueries[key];
  };

  vm.cancel = function cancel() { ModalInstance.dismiss(); };

  // submit the filter object to the parent controller.
  vm.submit = function submit() {
    // delete type_ids if there is no transaction type sent
    if (vm.searchQueries.type_ids && vm.searchQueries.type_ids.length === 0) {
      vm.clear('type_ids');
    }

    // update the 'reversed' flag to update the view value correctly
    if (angular.isDefined(vm.searchQueries.reversed)) {
      displayValues.reversed = vm.searchQueries.reversed;
    }

    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);

    return ModalInstance.close(loggedChanges);
  };

}
