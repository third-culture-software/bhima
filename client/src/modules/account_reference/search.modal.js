angular.module('bhima.controllers')
  .controller('ReferenceSearchModalController', ReferenceSearchModalController);

ReferenceSearchModalController.$inject = [
  '$uibModalInstance', 'filters', 'Store', 'util',
  'PatientService', 'AccountService', 'FormatTreeDataService',
  'SearchModalUtilService',
];

/**
 * @param ModalInstance
 * @param filters
 * @param Store
 * @param util
 * @param Patients
 * @param Accounts
 * @param FormatTreeData
 * @param SearchModal
 * @class ReferenceSearchModalController
 * @description
 * This controller is responsible for setting up the filters for the Account Reference
 * search functionality on the Account Reference registry page.  Filters that are already
 * applied to the grid can be passed in via the filters inject.
 */
function ReferenceSearchModalController(
  ModalInstance, filters, Store, util,
  Patients, Accounts, FormatTreeData, SearchModal,
) {
  const vm = this;
  const changes = new Store({ identifier : 'key' });

  // displayValues will be an id:displayValue pair
  const displayValues = {};

  const searchQueryOptions = [
    'abbr', 'number', 'description', 'reference_type_id', 'is_exception',
  ];

  vm.filters = filters;

  vm.today = new Date();
  vm.defaultQueries = {};
  vm.searchQueries = {};
  vm.select = {};
  vm.clear = clear;
  vm.clearAccount = clearAccount;
  vm.onSelectAccountReferenceType = onSelectAccountReferenceType;

  Accounts.read()
    .then(elements => {
      // bind the accounts to the controller
      const accounts = FormatTreeData.order(elements);
      vm.accounts = accounts;
    });

  const lastDisplayValues = Patients.filters.getDisplayValueMap();

  // assign already defined custom filters to searchQueries object
  vm.searchQueries = util.maskObjectFromKeys(filters, searchQueryOptions);

  // bind methods
  vm.submit = submit;
  vm.cancel = cancel;

  /**
   *
   * @param key
   */
  function clear(key) {
    delete vm.searchQueries[key];
  }

  /**
   *
   * @param key
   */
  function clearAccount(key) {
    delete vm.select[key];
  }

  // callback for Account Reference Type
  /**
   *
   * @param referenceType
   */
  function onSelectAccountReferenceType(referenceType) {
    vm.searchQueries.reference_type_id = referenceType.id;
    displayValues.reference_type_id = referenceType.label;
  }

  // returns the parameters to the parent controller
  /**
   *
   */
  function submit() {
    if (vm.select.account) {
      vm.searchQueries.number = vm.select.account.number;
      displayValues.number = `${vm.select.account.number} - ${vm.select.account.label}`;
    } else {
      vm.searchQueries.number = null;
      displayValues.number = null;
    }

    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);
    return ModalInstance.close(loggedChanges);
  }

  // dismiss the modal
  /**
   *
   */
  function cancel() {
    ModalInstance.close();
  }
}
