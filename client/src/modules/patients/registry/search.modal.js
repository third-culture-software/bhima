angular.module('bhima.controllers')
  .controller('PatientRegistryModalController', PatientRegistryModalController);

PatientRegistryModalController.$inject = [
  '$uibModalInstance', 'filters', 'Store', 'util', 'PeriodService', 'PatientService',
  'SearchModalUtilService',
];

/**
 * @param ModalInstance
 * @param filters
 * @param Store
 * @param util
 * @param Periods
 * @param Patients
 * @param SearchModal
 * @class PatientRegistryModalController
 * @description
 * This controller is responsible for setting up the filters for the patient
 * search functionality on the patient registry page.  Filters that are already
 * applied to the grid can be passed in via the filters inject.
 */
function PatientRegistryModalController(ModalInstance, filters, Store, util, Periods, Patients, SearchModal) {
  const vm = this;
  const changes = new Store({ identifier : 'key' });

  // displayValues will be an id:displayValue pair
  const displayValues = {};

  const searchQueryOptions = [
    'display_name', 'sex', 'hospital_no', 'reference', 'dateBirthFrom', 'dateBirthTo',
    'dateRegistrationFrom', 'dateRegistrationTo', 'debtor_group_uuid', 'project_id',
    'patient_group_uuid', 'user_id', 'defaultPeriod', 'originLocationLabel',
  ];

  vm.filters = filters;

  vm.today = new Date();
  vm.defaultQueries = {};
  vm.searchQueries = {};

  // assign default limit filter
  if (filters.limit) {
    vm.defaultQueries.limit = filters.limit;
  }

  const lastDisplayValues = Patients.filters.getDisplayValueMap();

  // assign already defined custom filters to searchQueries object
  vm.searchQueries = util.maskObjectFromKeys(filters, searchQueryOptions);

  // bind methods
  vm.submit = submit;
  vm.cancel = cancel;
  vm.clear = clear;

  vm.onSelectDebtor = function onSelectDebtor(debtorGroup) {
    vm.searchQueries.debtor_group_uuid = debtorGroup.uuid;
    displayValues.debtor_group_uuid = debtorGroup.name;
  };

  vm.onSelectProject = (project) => {
    displayValues.project_id = project.name;
    vm.searchQueries.project_id = project.id;
  };

  vm.onSelectPatientGroup = function onSelectPatientGroup(patientGroup) {
    vm.searchQueries.patient_group_uuid = patientGroup.uuid;
    displayValues.patient_group_uuid = patientGroup.name;
  };

  // custom filter user_id - assign the value to the searchQueries object
  vm.onSelectUser = function onSelectUser(user) {
    vm.searchQueries.user_id = user.id;
    displayValues.user_id = user.display_name;
  };

  // default filter limit - directly write to changes list
  vm.onSelectLimit = function onSelectLimit(val) {
    // input is type value, this will only be defined for a valid number
    if (angular.isDefined(val)) {
      changes.post({ key : 'limit', value : val });
    }
  };

  // default filter period - directly write to changes list
  vm.onSelectPeriod = function onSelectPeriod(period) {
    const periodFilters = Periods.processFilterChanges(period);

    periodFilters.forEach((filterChange) => {
      changes.post(filterChange);
    });
  };

  // returns the parameters to the parent controller
  /**
   *
   */
  function submit() {
    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);
    return ModalInstance.close(loggedChanges);
  }

  /**
   *
   * @param value
   */
  function clear(value) {
    delete vm.searchQueries[value];
  }

  // dismiss the modal
  /**
   *
   */
  function cancel() {
    ModalInstance.close();
  }
}
