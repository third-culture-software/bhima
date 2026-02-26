angular.module('bhima.services')
  .service('UserService', UserService);

UserService.$inject = ['PrototypeApiService', '$uibModal', 'FilterService', 'bhConstants', 'AppCache',
  'PeriodService', '$httpParamSerializer', 'LanguageService'];

/**
 * User Service
 * @param Api
 * @param $uibModal
 * @param Filters
 * @param bhConstants
 * @param AppCache
 * @param Periods
 * @param $httpParamSerializer
 * @param Languages
 * @description
 * This service implements CRUD on the /users endpoint on the client.
 */
function UserService(Api, $uibModal, Filters, bhConstants, AppCache, Periods, $httpParamSerializer,
  Languages) {
  const service = new Api('/users/');

  service.update = update;
  service.projects = projects;
  service.depots = depots;
  service.depotsSupervision = depotsSupervision;
  service.cashboxes = cashboxes;
  service.updatePassword = updatePassword;
  service.updatePermissions = updatePermissions;
  service.validatePassword = validatePassword;
  service.updateDepots = updateDepots;
  service.updateDepotsSupervision = updateDepotsSupervision;
  service.cashBoxManagement = cashBoxManagement;
  service.openSearchModal = openSearchModal;

  const filters = new Filters();
  const filterCache = new AppCache('users-filters');

  filters.registerDefaultFilters(bhConstants.defaultFilters);

  filters.registerCustomFilters([
    { key : 'uuid', label : 'FORM.LABELS.NAME' },
    { key : 'project_id', label : 'FORM.LABELS.PROJECT' },
    { key : 'role_uuid', label : 'FORM.LABELS.ROLES' },
    { key : 'cashbox_id', label : 'FORM.LABELS.CASHBOXES' },
    { key : 'depot_uuid', label : 'FORM.LABELS.DEPOT' },
    { key : 'display_name', label : 'FORM.LABELS.USERNAME' },
    { key : 'user_id', label : 'FORM.LABELS.USERNAME' },
    {
      key : 'login_date_from', label : 'USERS.LAST_LOGIN', comparitor : '>', valueFilter : 'date',
    },
    {
      key : 'login_date_to', label : 'USERS.LAST_LOGIN', comparitor : '<', valueFilter : 'date',
    },
  ]);

  if (filterCache.filters) {
    // load cached filter definition if it exists
    filters.loadCache(filterCache.filters);
  }

  service.filters = filters;

  // once the cache has been loaded - ensure that default filters are provided appropriate values
  assignDefaultFilters();

  /**
   *
   */
  function assignDefaultFilters() {
    // get the keys of filters already assigned - on initial load this will be empty
    const assignedKeys = Object.keys(filters.formatHTTP());

    // assign default period filter
    const periodDefined = service.util.arrayIncludes(assignedKeys, [
      'period', 'date_created', 'custom_period_start', 'custom_period_end',
    ]);

    if (!periodDefined) {
      filters.assignFilters(Periods.defaultFilters());
    }

    // assign default date_created filter
    if (assignedKeys.indexOf('date_created') === -1) {
      const defaultPeriod = Periods.index.today;
      filters.assignFilter('date_created', defaultPeriod.key, defaultPeriod.translateKey);
      filters.assignFilter('period', null, null);
    }

    // assign default limit filter
    if (assignedKeys.indexOf('limit') === -1) {
      filters.assignFilter('limit', 1000);
    }
  }

  service.removeFilter = function removeFilter(key) {
    filters.resetFilterState(key);
  };

  // load filters from cache
  service.cacheFilters = function cacheFilters() {
    filterCache.filters = filters.formatCache();
  };

  service.loadCachedFilters = function loadCachedFilters() {
    filters.loadCache(filterCache.filters || {});
  };

  /**
   * Construct the http query stgring for the GET URL
   * @param {string} renderer - name of report renderer (pdf, csv, xlsx)
   * @param {Array} params - parameters for rendering (must include: fiscal_year_id, filename)
   * @returns {string} - http query string for http GET call
   */
  service.exportToQueryString = function exportToQueryString(renderer, params) {
    const defaultOpts = {
      renderer,
      lang : Languages.key,
    };
    const options = angular.merge(defaultOpts, params);
    return $httpParamSerializer(options);
  };

  /**
   * Construct the http parameter string for the GET URL
   * @param {Array} params - parameters for report rendering
   * @returns {string} - http query string for http GET call
   */
  service.downloadExcelQueryString = function downloadExcelQueryString(params) {
    const defaultOpts = {
      renderer : 'xlsx',
      lang : Languages.key,
      // renameKeys : true,
    };
    const options = angular.merge(defaultOpts, params);
    return $httpParamSerializer(options);
  };
  /* ------------------------------------------------------------------------ */

  // updates a user with id
  /**
   *
   * @param id
   * @param user
   */
  function update(id, user) {

    // delete properties that should not be updated
    delete user.last_login;
    delete user.id;
    delete user.active;
    delete user.roles;
    delete user.cashboxes;
    delete user.depots;

    return service.$http.put(`/users/${id}`, user)
      .then(service.util.unwrapHttpResponse);
  }

  // loads the users's project permissions
  /**
   *
   * @param id
   */
  function projects(id) {
    return service.$http.get(`/users/${id}/projects`)
      .then(service.util.unwrapHttpResponse);
  }

  // loads the users's depot permissions
  /**
   *
   * @param id
   */
  function depots(id) {
    return service.$http.get(`/users/${id}/depots`)
      .then(service.util.unwrapHttpResponse);
  }

  // loads the users's depot supervisions
  /**
   *
   * @param id
   */
  function depotsSupervision(id) {
    return service.$http.get(`/users/${id}/depotsSupervision`)
      .then(service.util.unwrapHttpResponse);
  }

  // loads the users's cashbox permissions
  /**
   *
   * @param id
   */
  function cashboxes(id) {
    return service.$http.get(`/users/${id}/cashboxes`)
      .then(service.util.unwrapHttpResponse);
  }

  // sets a user's permissions using the public API
  /**
   *
   * @param id
   * @param data
   */
  function updatePermissions(id, data) {
    return service.$http.post(`/users/${id}/permissions`, { permissions : data })
      .then(service.util.unwrapHttpResponse);
  }

  // sets a user's Depot Management using the public API
  /**
   *
   * @param id
   * @param data
   */
  function updateDepots(id, data) {
    return service.$http.post(`/users/${id}/depots`, { depots : data })
      .then(service.util.unwrapHttpResponse);
  }

  // sets a user's Depot Supervision using the public API
  /**
   *
   * @param id
   * @param data
   */
  function updateDepotsSupervision(id, data) {
    return service.$http.post(`/users/${id}/depotsSupervision`, { depots : data })
      .then(service.util.unwrapHttpResponse);
  }

  // sets a user's Cashbox Management using the public API
  /**
   *
   * @param id
   * @param data
   */
  function cashBoxManagement(id, data) {
    return service.$http.post(`/users/${id}/cashboxes`, { cashboxes : data })
      .then(service.util.unwrapHttpResponse);
  }

  // sets a user's password using the public API
  /**
   *
   * @param id
   * @param data
   */
  function updatePassword(id, data) {
    return service.$http.put(`/users/${id}/password`, data)
      .then(service.util.unwrapHttpResponse);
  }

  /**
   * @function validatePassword
   * @param {string} passwordA - a user password
   * @param {string} passwordB - a challenge password
   * @description
   * This function exists to validate password inputs where two passwords are
   * required and must be equal.  This is involved in updating/creating a user
   * password to ensure that the password is correctly memorized by the user..
   */
  function validatePassword(passwordA, passwordB) {
    return passwordA && passwordA.length && passwordA === passwordB;
  }

  /**
   * @function openSearchModal
   * @param {object} params - an object of filter parameters to be passed to
   *   the modal.
   * @returns {Promise} modalInstance
   */
  function openSearchModal(params) {
    return $uibModal.open({
      templateUrl : 'modules/users/search.modal.html',
      size : 'md',
      keyboard : false,
      animation : false,
      backdrop : 'static',
      controller : 'UserRegistryModalController as $ctrl',
      resolve : {
        filters : () => params,
      },
    }).result;
  }
  return service;
}
