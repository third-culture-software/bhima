angular.module('bhima.controllers')
  .controller('EmployeeRegistryModalController', EmployeeRegistryModalController);

EmployeeRegistryModalController.$inject = [
  '$uibModalInstance', 'SearchModalUtilService', 'Store', 'util', 'filters', 'EmployeeService',
];

/**
 * @class EmployeeRegistryModalController
 *
 * @description
 * This controller is responsible for setting up the filters for the employee
 * search functionality on the employee registry page.
 */
function EmployeeRegistryModalController(ModalInstance, SearchModal, Store, util, filters, Employees) {
  const vm = this;
  const changes = new Store({ identifier : 'key' });

  // displayValues will be an id:displayValue pair
  const displayValues = {};

  vm.filters = filters;
  vm.searchQueries = {};
  vm.defaultQueries = {};
  vm.formatHiringDates = formatHiringDates;

  const lastDisplayValues = Employees.filters.getDisplayValueMap();

  // these properties will be used to filter employee data form the client
  const searchQueryOptions = [
    'display_name', 'sex', 'code', 'dateBirthFrom', 'dateBirthTo',
    'dateEmbaucheFrom', 'dateEmbaucheTo', 'grade_uuid', 'fonction_id', 'locked',
    'service_uuid', 'cost_center_id', 'is_medical', 'reference', 'title_employee_id',
  ];

  // assign already defined custom filters to searchQueries object
  vm.searchQueries = util.maskObjectFromKeys(filters, searchQueryOptions);

  // assign default filters
  if (filters.limit) {
    vm.defaultQueries.limit = filters.limit;
  }

  // bind methods
  vm.submit = submit;
  vm.cancel = cancel;
  vm.clear = clear;

  // custom filter service_uuid - assign the value to the searchQueries object
  vm.onSelectService = function onSelectService(service) {
    displayValues.service_uuid = service.name;
    vm.searchQueries.service_uuid = service.uuid;
  };

  // custom filter cost_center_id - assign the value to the searchQueries object
  vm.onCostCenterSelect = function onCostCenterSelect(center) {
    displayValues.cost_center_id = center.label;
    vm.searchQueries.cost_center_id = center.id;
  };

  // custom filter grade_uuid - assign the value to the searchQueries object
  vm.onSelectGrade = function onSelectGrade(grade) {
    displayValues.grade_uuid = grade.text;
    vm.searchQueries.grade_uuid = grade.uuid;
  };

  vm.onLockedChange = value => {
    vm.searchQueries.locked = value;
  };

  // custom filter fonction_id - assign the value to the searchQueries object
  vm.onSelectFonction = function onSelectFonction(fonction) {
    displayValues.fonction_id = fonction.fonction_txt;
    vm.searchQueries.fonction_id = fonction.id;
  };

  // custom filter title_employee_id - assign the value to the searchQueries object
  vm.onSelectTitle = function onSelectTitle(title) {
    displayValues.title_employee_id = title.title_txt;
    vm.searchQueries.title_employee_id = title.id;
  };

  // clears search parameters.  Custom logic if a date is used so that we can
  // clear two properties.
  function clear(key) {
    delete vm.searchQueries[key];
  }

  // dismiss the modal
  function cancel() {
    ModalInstance.close();
  }

  // stores the hiring dates in the display value
  function formatHiringDates() {
    if (vm.searchQueries.dateEmbaucheFrom) {
      displayValues.dateEmbaucheFrom = vm.searchQueries.dateEmbaucheFrom;
    }

    if (vm.searchQueries.dateEmbaucheTo) {
      displayValues.dateEmbaucheTo = vm.searchQueries.dateEmbaucheTo;
    }
  }

  // returns the parameters to the parent controller
  function submit(form) {
    if (form.$invalid) { return 0; }
    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);
    return ModalInstance.close(loggedChanges);
  }

  // default filter limit - directly write to changes list
  vm.onSelectLimit = function onSelectLimit(value) {
    // input is type value, this will only be defined for a valid number
    if (angular.isDefined(value)) {
      changes.post({ key : 'limit', value });
    }
  };
}
