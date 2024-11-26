angular.module('bhima.controllers')
  .controller('AdmissionRegistryModalController', AdmissionRegistryModalController);

AdmissionRegistryModalController.$inject = [
  '$uibModalInstance', 'filters', 'Store', 'util', 'PeriodService', 'VisitService',
  'SearchModalUtilService',
];

function AdmissionRegistryModalController(ModalInstance, filters, Store, util, Periods, Visits, SearchModal) {
  const vm = this;
  const changes = new Store({ identifier : 'key' });

  // displayValues will be an id:displayValue pair
  const displayValues = {};

  const searchQueryOptions = [
    'display_name', 'hospital_no', 'reference', 'start_date', 'end_date',
    'ward_name', 'room_label', 'bed_label', 'hospitalized', 'service_uuid',
    'is_pregnant', 'inside_health_zone', 'is_refered', 'is_new_case',
  ];

  vm.filters = filters;

  vm.today = new Date();
  vm.defaultQueries = {};

  // assign default limit filter
  if (filters.limit) {
    vm.defaultQueries.limit = filters.limit;
  }

  const lastDisplayValues = Visits.grid.getDisplayValueMap();

  vm.searchQueries = util.maskObjectFromKeys(filters, searchQueryOptions);

  // bind methods
  vm.submit = submit;
  vm.cancel = cancel;
  vm.clear = clear;

  vm.onSelectWard = ward => {
    vm.searchQueries.ward_uuid = ward.uuid;
    displayValues.ward_uuid = ward.name;
  };

  vm.onSelectRoom = room => {
    vm.searchQueries.room_uuid = room.uuid;
    displayValues.room_uuid = room.label;
  };

  vm.onSelectBed = bed => {
    vm.searchQueries.bed_id = bed.id;
    displayValues.bed_id = bed.label;
  };

  vm.onSelectService = service => {
    vm.searchQueries.service_uuid = service.uuid;
    displayValues.service_uuid = service.name;
  };

  vm.onReferralChange = value => {
    vm.searchQueries.is_refered = value;
  };

  vm.onPregnantChange = value => {
    vm.searchQueries.is_pregnant = value;
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
  function submit() {
    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);
    return ModalInstance.close(loggedChanges);
  }

  function clear(value) {
    delete vm.searchQueries[value];
  }

  // dismiss the modal
  function cancel() {
    ModalInstance.close();
  }
}
