angular.module('bhima.services')
  .service('MultipleIndicesPayrollService', MultipleIndicesPayrollService);

MultipleIndicesPayrollService.$inject = [
  'PrototypeApiService', 'TransactionTypeStoreService', '$uibModal',
  'FilterService', 'PeriodService', 'LanguageService', '$httpParamSerializer',
  'appcache', 'TransactionService',
];

/**
 * @param Api
 * @param TransactionTypeStore
 * @param Modal
 * @param Filters
 * @param Periods
 * @param Languages
 * @param $httpParamSerializer
 * @param AppCache
 * @param Transactions
 * @class MultipleIndicesPayrollService
 * @augments PrototypeApiService
 * @description
 * This service manages posting data to the database via the /multiple_payroll/ URL.  It also
 * includes some utilities that are useful for Multiple Payroll pages.
 */
function MultipleIndicesPayrollService(
  Api, TransactionTypeStore, Modal, Filters, Periods, Languages,
  $httpParamSerializer, AppCache, Transactions,
) {
  const service = new Api('/multiple_payroll_indice/');
  service.parameters = new Api('/multiple_payroll_indice/parameters/');

  const multiplePayrollFilters = new Filters();
  const filterCache = new AppCache('multiple-indices-payroll-filters');

  service.remove = Transactions.remove;
  service.openSearchModal = openSearchModal;
  service.staffingParametersModal = staffingParametersModal;
  service.importConfigModal = importConfigModal;

  service.filters = multiplePayrollFilters;
  service.cacheFilters = cacheFilters;
  service.removeFilter = removeFilter;
  service.loadCachedFilters = loadCachedFilters;
  service.download = download;
  service.getConfiguration = getConfiguration;
  service.setConfiguration = setConfiguration;
  service.paymentCommitment = paymentCommitment;
  service.configurations = configurations;

  // loads the Payroll Configuration
  /**
   *
   * @param id
   * @param params
   */
  function getConfiguration(id, params) {
    return service.$http.get(`/multiple_payroll/${id}/configuration`, { params })
      .then(service.util.unwrapHttpResponse);
  }

  // Set Multi Payroll Configuration using the public API
  /**
   *
   * @param id
   * @param data
   */
  function setConfiguration(id, data) {
    return service.$http.post(`/multiple_payroll/${id}/configuration`, { data })
      .then(service.util.unwrapHttpResponse);
  }

  // Set Employees Configured for Payroll
  /**
   *
   * @param id
   * @param data
   */
  function configurations(id, data) {
    return service.$http.post(`/multiple_payroll/${id}/multiConfiguration`, { data })
      .then(service.util.unwrapHttpResponse);
  }

  /**
   *Put Employees on the Payment Agreement List
   *Transfer of the entries in accountants for the commitment of payment
   * @param id
   * @param data
   */
  function paymentCommitment(id, data) {
    return service.$http.post(`/multiple_payroll/${id}/commitment`, { data })
      .then(service.util.unwrapHttpResponse);
  }

  multiplePayrollFilters.registerDefaultFilters([
    { key : 'payroll_configuration_id', label : 'FORM.LABELS.PERIOD_PAYMENT' },
    { key : 'currency_id', label : 'FORM.LABELS.CURRENCY' },
  ]);

  if (filterCache.filters) {
    multiplePayrollFilters.loadCache(filterCache.filters);
  }

  /**
   *
   * @param key
   */
  function removeFilter(key) {
    multiplePayrollFilters.resetFilterState(key);
  }

  // load filters from cache
  /**
   *
   */
  function cacheFilters() {
    filterCache.filters = multiplePayrollFilters.formatCache();
  }

  /**
   *
   */
  function loadCachedFilters() {
    multiplePayrollFilters.loadCache(filterCache.filters || {});
  }

  // downloads a type of report based on the
  /**
   *
   * @param type
   */
  function download(type) {
    const filterOpts = multiplePayrollFilters.formatHTTP();
    const defaultOpts = { renderer : type, lang : Languages.key };

    // combine options
    const options = angular.merge(defaultOpts, filterOpts);
    // return  serialized options
    return $httpParamSerializer(options);
  }

  /**
   * @param filters
   * @function openSearchModal
   * @description
   * This functions opens the search modal form for the voucher registry.
   */
  function openSearchModal(filters) {
    return Modal.open({
      templateUrl : 'modules/multiple_payroll_indice/modals/search.modal.html',
      size : 'md',
      animation : false,
      keyboard : false,
      backdrop : 'static',
      controller : 'MultiPayrollIndiceSearchModalController as $ctrl',
      resolve : {
        filters : function filtersProvider() { return filters; },
      },
    }).result;
  }

  /**
   *
   */
  function staffingParametersModal() {
    return Modal.open({
      templateUrl : 'modules/multiple_payroll_indice/modals/parameter.modal.html',
      size : 'md',
      animation : false,
      keyboard : false,
      backdrop : 'static',
      controller : 'MultiPayrollIndiceParamModalController as $ctrl',
    }).result;
  }

  /**
   *
   * @param configuration
   */
  function importConfigModal(configuration) {
    return Modal.open({
      templateUrl : 'modules/multiple_payroll_indice/modals/import.modal.html',
      size : 'md',
      animation : false,
      keyboard : false,
      backdrop : 'static',
      controller : 'MultiPayrollIndiceImportModalController as $ctrl',
      resolve : {
        data : () => configuration,
      },
    }).result;
  }

  return service;
}
