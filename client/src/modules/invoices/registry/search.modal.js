angular.module('bhima.controllers')
  .controller('InvoiceRegistrySearchModalController', InvoiceRegistrySearchModalController);

InvoiceRegistrySearchModalController.$inject = [
  '$uibModalInstance', 'filters', 'Store',
  'PeriodService', 'util', 'PatientInvoiceService',
  'SearchModalUtilService',
];

/**
 * @param ModalInstance
 * @param filters
 * @param Store
 * @param Periods
 * @param util
 * @param Invoices
 * @param SearchModal
 * @class InvoiceRegistrySearchModalController
 * @description
 * This controller is responsible to collecting data from the search form and modifying
 * the underlying filters before passing them back to the parent controller.
 */
function InvoiceRegistrySearchModalController(
  ModalInstance, filters, Store,
  Periods, util, Invoices, SearchModal,
) {
  const vm = this;
  const changes = new Store({ identifier : 'key' });
  vm.filters = filters;

  vm.defaultQueries = {};

  // displayValues will be an id:displayValue pair
  const displayValues = {};
  const lastDisplayValues = Invoices.filters.getDisplayValueMap();

  // assign default limit filter
  if (filters.limit) {
    vm.defaultQueries.limit = filters.limit;
  }

  // @TODO ideally these should be passed in when the modal is initialised
  //       these are known when the filter service is defined
  const searchQueryOptions = [
    'is_caution', 'reference', 'cashbox_id', 'user_id', 'reference_patient',
    'currency_id', 'reversed', 'service_uuid', 'debtor_group_uuid', 'description',
    'project_id',
  ];

  // assign already defined custom filters to searchQueries object
  vm.searchQueries = util.maskObjectFromKeys(filters, searchQueryOptions);

  // set controller data
  vm.cancel = ModalInstance.close;

  // Set up page elements data (debtor select data)
  vm.onSelectDebtor = function onSelectDebtor(debtorGroup) {
    displayValues.debtor_group_uuid = debtorGroup.name;
    vm.searchQueries.debtor_group_uuid = debtorGroup.uuid;
  };

  // custom filter user_id - assign the value to the searchQueries object
  vm.onSelectUser = function onSelectUser(user) {
    displayValues.user_id = user.display_name;
    vm.searchQueries.user_id = user.id;
  };

  vm.onSelectProject = (project) => {
    displayValues.project_id = project.name;
    vm.searchQueries.project_id = project.id;
  };

  // custom filter service_uuid - assign the value to the searchQueries object
  vm.onSelectService = function onSelectService(service) {
    displayValues.service_uuid = service.name;
    vm.searchQueries.service_uuid = service.uuid;
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

    periodFilters.forEach(filterChange => {
      changes.post(filterChange);
    });
  };

  // deletes a filter from the custom filter object, this key will no longer be written to changes on exit
  vm.clear = function clear(key) {
    delete vm.searchQueries[key];
  };

  // returns the filters to the journal to be used to refresh the page
  vm.submit = () => {
    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);
    return ModalInstance.close(loggedChanges);
  };
}
