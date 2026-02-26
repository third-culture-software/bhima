angular.module('bhima.services')
  .service('JournalLogService', JournalLogService);

JournalLogService.$inject = [
  'PrototypeApiService', 'AppCache', 'FilterService', 'PeriodService',
  '$uibModal', 'bhConstants',
];

/**
 *
 * @param Api
 * @param AppCache
 * @param Filters
 * @param Periods
 * @param Modal
 * @param bhConstants
 */
function JournalLogService(Api, AppCache, Filters, Periods, Modal, bhConstants) {
  const URL = '/journal/log';
  const service = new Api(URL);
  const filterCache = new AppCache('journal-log-filters');
  const logFilters = new Filters();

  service.filters = logFilters;
  service.openSearchModal = openSearchModal;

  // default filters will always be applied
  logFilters.registerDefaultFilters(bhConstants.defaultFilters);

  // custom filters can be optionally applied
  logFilters.registerCustomFilters([
    { key : 'trans_id', label : 'FORM.LABELS.TRANS_ID' },
    { key : 'record_uuid', label : 'FORM.LABELS.TRANS_ID' },
    { key : 'reference', label : 'FORM.LABELS.REFERENCE' },
    { key : 'user_id', label : 'FORM.LABELS.USER' },
    { key : 'hrRecord', label : 'TABLE.COLUMNS.RECORD' },
    { key : 'hrReference', label : 'TABLE.COLUMNS.REFERENCE' },
    { key : 'description', label : 'FORM.LABELS.DESCRIPTION' },
    { key : 'action', label : 'TABLE.COLUMNS.ACTION' },
  ]);

  if (filterCache.filters) {
    logFilters.loadCache(filterCache.filters);
  }

  assignDefaultFilters();

  /**
   *
   */
  function assignDefaultFilters() {
    const assignedKeys = Object.keys(logFilters.formatHTTP());

    const periodDefined = service.util.arrayIncludes(
      assignedKeys,
      ['period', 'custom_period_start', 'custom_period_end'],
    );

    if (!periodDefined) {
      logFilters.assignFilters(Periods.defaultFilters());
    }

    if (assignedKeys.indexOf('limit') === -1) {
      logFilters.assignFilter('limit', 100);
    }
  }

  service.removeFilter = function removeFilter(key) {
    logFilters.resetFilterState(key);
  };

  service.cacheFilters = function cacheFilters() {
    filterCache.filters = logFilters.formatCache();
  };

  service.loadCachedFilters = function loadCachedFilters() {
    logFilters.loadCache(filterCache.filters || {});
  };

  /**
   * @function openSearchModal
   * @param {object} filters
   */
  function openSearchModal(filters) {
    return Modal.open({
      templateUrl : 'modules/journal/modals/search_log.modal.html',
      controller :  'JournalSearchLogModalController as ModalCtrl',
      backdrop : 'static',
      resolve : {
        data : () => filters,
      },
    }).result;
  }

  return service;
}
