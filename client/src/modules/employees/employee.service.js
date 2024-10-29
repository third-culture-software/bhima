angular.module('bhima.services')
  .service('EmployeeService', EmployeeService);

EmployeeService.$inject = [
  'FilterService', '$uibModal', 'PrototypeApiService', 'appcache', 'LanguageService', '$httpParamSerializer',
];

/**
 * @class EmployeeService
 * @extends PrototypeApiService
 *
 * @description
 * Encapsulates common requests to the /employees/ URL.
 */
function EmployeeService(Filters, $uibModal, Api, AppCache, Languages, $httpParamSerializer) {
  const service = new Api('/employees/');
  const employeeFilters = new Filters();
  const filterCache = new AppCache('employee-filters');

  service.openSearchModal = openSearchModal;
  service.filters = employeeFilters;
  service.removeFilter = removeFilter;
  service.employeeFilters = employeeFilters;
  service.loadCachedFilters = loadCachedFilters;
  service.cacheFilters = cacheFilters;
  service.download = download;
  service.advantage = advantage;
  service.patientToEmployee = patientToEmployee;

  employeeFilters.registerDefaultFilters([{ key : 'limit', label : 'FORM.LABELS.LIMIT' }]);

  employeeFilters.registerCustomFilters([
    { key : 'display_name', label : 'FORM.LABELS.NAME' },
    { key : 'sex', label : 'FORM.LABELS.GENDER' },
    { key : 'locked', label : 'FORM.LABELS.LOCKED', valueFilter : 'boolean' },
    { key : 'code', label : 'FORM.LABELS.CODE' },
    {
      key : 'dateBirthFrom', label : 'FORM.LABELS.DOB', comparitor : '>', valueFilter : 'date',
    },
    {
      key : 'dateBirthTo', label : 'FORM.LABELS.DOB', comparitor : '<', valueFilter : 'date',
    },
    {
      key : 'dateEmbaucheFrom', label : 'FORM.LABELS.DATE_EMBAUCHE', comparitor : '>', valueFilter : 'date',
    },
    {
      key : 'dateEmbaucheTo', label : 'FORM.LABELS.DATE_EMBAUCHE', comparitor : '<', valueFilter : 'date',
    },
    { key : 'grade_uuid', label : 'FORM.LABELS.GRADE' },
    { key : 'reference', label : 'FORM.LABELS.REFERENCE' },
    { key : 'fonction_id', label : 'FORM.LABELS.FUNCTION' },
    { key : 'service_uuid', label : 'FORM.LABELS.SERVICE' },
    { key : 'cost_center_id', label : 'FORM.LABELS.COST_CENTER' },
    { key : 'is_medical', label : 'FORM.LABELS.MEDICAL_STAFF', valueFilter : 'boolean' },
    { key : 'title_employee_id', label : 'FORM.LABELS.PROFESSION' },
  ]);

  if (filterCache.filters) {
    // load cached filter definition if it exists
    employeeFilters.loadCache(filterCache.filters);
  }

  // once the cache has been loaded - ensure that default filters are provided appropriate values
  assignDefaultFilters();

  function assignDefaultFilters() {
    // get the keys of filters already assigned - on initial load this will be empty
    const assignedKeys = Object.keys(employeeFilters.formatHTTP());

    // assign default limit filter
    if (assignedKeys.indexOf('limit') === -1) {
      employeeFilters.assignFilter('limit', 100);
    }
  }

  function advantage(uuid) {
    const url = ''.concat(uuid, '/advantage');
    return Api.read.call(service, url);
  }

  function removeFilter(key) {
    employeeFilters.resetFilterState(key);
  }

  // load filters from cache
  function cacheFilters() {
    filterCache.filters = employeeFilters.formatCache();
  }

  function loadCachedFilters() {
    employeeFilters.loadCache(filterCache.filters || {});
  }

  /**
   * @method openSearchModal
   *
   * @param {Object} params - an object of filter parameters to be passed to
   *   the modal.
   * @returns {Promise} modalInstance
   */
  function openSearchModal(params) {
    return $uibModal.open({
      templateUrl : 'modules/employees/registry/search.modal.html',
      controller : 'EmployeeRegistryModalController as ModalCtrl',
      resolve : { filters : () => params },
    }).result;
  }

  function download(type) {
    const filterOpts = employeeFilters.formatHTTP();
    const defaultOpts = { renderer : type, lang : Languages.key };

    // combine options
    const options = angular.merge(defaultOpts, filterOpts);

    // return  serialized options
    return $httpParamSerializer(options);
  }

  // transform patient to employee
  function patientToEmployee(data) {
    return service.$http.post(`/employees/patient_employee`, data)
      .then(service.util.unwrapHttpResponse);
  }

  return service;
}
