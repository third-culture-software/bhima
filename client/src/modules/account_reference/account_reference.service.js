angular.module('bhima.services')
  .service('AccountReferenceService', AccountReferenceService);

AccountReferenceService.$inject = ['PrototypeApiService', 'FilterService', '$uibModal', 'appcache'];

/**
 * Account Reference Service
 *
 * This service implements CRUD on the /account_reference endpoint on the client
 * @param Api
 * @param Filters
 * @param $uibModal
 * @param AppCache
 */
function AccountReferenceService(Api, Filters, $uibModal, AppCache) {
  const service = Api('/accounts/references/');

  const referencesFilters = new Filters();
  const filterCache = new AppCache('accounts-references');

  service.filters = referencesFilters;
  service.openSearchModal = openSearchModal;

  /**
   * @param abbr
   * @function getAccountsForReference
   * @description
   * Returns the list of accounts associated with a reference.
   */
  service.getAccountsForReference = function getAccountsForReference(abbr) {
    return service.$http.get(`/accounts/references/${abbr}/accounts`)
      .then(service.util.unwrapHttpResponse);
  };

  referencesFilters.registerCustomFilters([
    { key : 'abbr', label : 'ACCOUNT.REFERENCE.REFERENCE' },
    { key : 'number', label : 'FORM.LABELS.ACCOUNT' },
    { key : 'description', label : 'ACCOUNT.REFERENCE.DESCRIPTION' },
    { key : 'reference_type_id', label : 'FORM.LABELS.TYPE' },
    { key : 'is_exception', label : 'ACCOUNT.REFERENCE.EXCEPTION', valueFilter : 'boolean' },
  ]);

  if (filterCache.filters) {
    // load cached filter definition if it exists
    referencesFilters.loadCache(filterCache.filters);
  }

  service.removeFilter = function removeFilter(key) {
    referencesFilters.resetFilterState(key);
  };

  // load filters from cache
  service.cacheFilters = function cacheFilters() {
    filterCache.filters = referencesFilters.formatCache();
  };

  service.loadCachedFilters = function loadCachedFilters() {
    referencesFilters.loadCache(filterCache.filters || {});
  };

  /**
   * @function openSearchModal
   * @param {object} params - an object of filter parameters to be passed to
   *   the modal.
   * @returns {Promise} modalInstance
   */
  function openSearchModal(params) {
    return $uibModal.open({
      templateUrl : 'modules/account_reference/search.modal.html',
      size : 'md',
      keyboard : false,
      animation : false,
      backdrop : 'static',
      controller : 'ReferenceSearchModalController as $ctrl',
      resolve : {
        filters : function paramsProvider() { return params; },
      },
    }).result;
  }

  return service;
}
