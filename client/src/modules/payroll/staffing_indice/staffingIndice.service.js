angular.module('bhima.services')
  .service('StaffingIndiceService', StaffingIndiceService);

StaffingIndiceService.$inject = [
  'PrototypeApiService', 'FilterService',
  'AppCache', 'bhConstants', '$uibModal',
  'PeriodService',
];

/**
 * staffing indices Service
 *
 * A service wrapper for the /staffing_indices HTTP endpoint.
 * @param Api
 * @param Filters
 * @param AppCache
 * @param bhConstants
 * @param Modal
 * @param Periods
 */
function StaffingIndiceService(Api, Filters, AppCache, bhConstants, Modal, Periods) {
  const service = new Api('/staffing_indices/');
  service.gradeIndice = new Api('/staffing_grade_indices/');
  service.functionIndice = new Api('/staffing_function_indices/');

  service.openSearchModal = openSearchModal;

  // set up base filters
  const filterCache = new AppCache('staffing-filters');
  const staffingFilters = new Filters();
  service.filters = staffingFilters;

  // default filters will always be applied
  staffingFilters.registerDefaultFilters(bhConstants.defaultFilters);
  // custom filters can be optionally applied
  staffingFilters.registerCustomFilters([
    { key : 'employee_uuid', label : 'FORM.LABELS.EMPLOYEE_NAME' },
    { key : 'created_at', label : 'FORM.LABELS.CREATED_AT' },
  ]);

  if (filterCache.filters) {
    // load cached filter definition if it exists
    staffingFilters.loadCache(filterCache.filters);
  }

  assignDefaultFilters();

  /**
   *
   */
  function assignDefaultFilters() {
    // get the keys of filters already assigned - on initial load this will be empty
    const assignedKeys = Object.keys(staffingFilters.formatHTTP());

    // assign default period filter
    const periodDefined = service.util.arrayIncludes(
      assignedKeys,
      ['period', 'custom_period_start', 'custom_period_end'],
    );

    if (!periodDefined) {
      staffingFilters.assignFilters(Periods.defaultFilters());
    }

    // assign default limit filter
    if (assignedKeys.indexOf('limit') === -1) {
      staffingFilters.assignFilter('limit', 100);
    }
  }

  /**
   *
   * @param filters
   * @param options
   */
  function openSearchModal(filters, options) {
    return Modal.open({
      templateUrl : 'modules/payroll/staffing_indice/modal/search.modal.html',
      controller :  'StaffingSearchModalController as ModalCtrl',
      backdrop : 'static',
      resolve : {
        filters : () => filters,
        options : () => options || {},
      },
    }).result;
  }

  service.loadCachedFilters = function loadCachedFilters() {
    staffingFilters.loadCache(filterCache.filters || {});
  };

  // load filters from cache
  service.cacheFilters = () => {
    filterCache.filters = staffingFilters.formatCache();
  };

  service.removeFilter = function removeFilter(key) {
    staffingFilters.resetFilterState(key);
  };

  // loads the Rubrics Grade data
  service.rubricGradeRead = function rubricGradeRead(params) {
    return service.$http.get(`/rubrics_grade/`, { params })
      .then(service.util.unwrapHttpResponse);
  };

  service.rubricGradeCreate = function rubricGradeCreate(data) {
    return service.$http.post(`/rubrics_grade/`, { data })
      .then(service.util.unwrapHttpResponse);
  };

  service.gradeRubricsDelete = function gradeRubricsDelete(uuid) {
    return service.$http.delete('/rubrics_grade/'.concat(uuid));
  };

  service.getRubricsGradeEmp = function getRubricsGradeEmp(params) {
    return service.$http.get(`/rubrics_grade_employee/`, { params })
      .then(service.util.unwrapHttpResponse);
  };

  return service;
}
