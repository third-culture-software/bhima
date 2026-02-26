angular.module('bhima.services')
  .service('DistributionCenterUpdateService', DistributionCenterUpdateService);

DistributionCenterUpdateService.$inject = ['PrototypeApiService', 'FilterService', 'appcache'];

/**
 * @param Api
 * @param Filters
 * @param AppCache
 * @class DistributionCenterUpdateService
 * @description
 * Encapsulates common requests to the /allocation_cost_center/ URL.
 */
function DistributionCenterUpdateService(Api, Filters, AppCache) {
  const service = new Api('/allocation_cost_center/');
  const distributionFilters = new Filters();
  const filterCache = new AppCache('distribution-center-update-filters');

  service.filters = distributionFilters;
  service.cacheFilters = cacheFilters;
  service.removeFilter = removeFilter;

  distributionFilters.registerDefaultFilters([
    { key : 'fiscal', label : 'FORM.LABELS.FISCAL_YEAR' },
    { key : 'periodFrom', label : 'FORM.LABELS.PERIOD_FROM' },
    { key : 'periodTo', label : 'FORM.LABELS.PERIOD_TO' },
    { key : 'typeCostCenter', label : 'FORM.LABELS.TYPE' },
  ]);

  distributionFilters.registerCustomFilters([
    { key : 'trans_id', label : 'FORM.LABELS.TRANSACTION' },
    { key : 'hrRecord', label : 'FORM.LABELS.RECORD' },
    { key : 'account_id', label : 'FORM.LABELS.ACCOUNT' },
    { key : 'cost_center_id', label : 'FORM.LABELS.COST_CENTER' },
  ]);

  if (filterCache.filters) {
    distributionFilters.loadCache(filterCache.filters);
  }

  // load filters from cache
  /**
   *
   */
  function cacheFilters() {
    filterCache.filters = distributionFilters.formatCache();
  }

  /**
   *
   * @param key
   */
  function removeFilter(key) {
    distributionFilters.resetFilterState(key);
  }

  return service;
}
