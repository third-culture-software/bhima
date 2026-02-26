angular.module('bhima.services')
  .service('CashService', CashService);

CashService.$inject = [
  '$uibModal', 'PrototypeApiService', '$translate', 'FilterService', 'appcache', 'PeriodService',
  'LanguageService', '$httpParamSerializer', 'bhConstants', 'TransactionService',
];

/**
 * @param Modal
 * @param Api
 * @param $translate
 * @param Filters
 * @param AppCache
 * @param Periods
 * @param Languages
 * @param $httpParamSerializer
 * @param bhConstants
 * @param Transactions
 * @class CashService
 * @augments PrototypeApiService
 * @description
 * A service to interact with the server-side /cash API.
 */
function CashService(
  Modal, Api, $translate, Filters, AppCache, Periods,
  Languages, $httpParamSerializer, bhConstants, Transactions,
) {
  const service = new Api('/cash/');
  const urlCheckin = '/cash/checkin/';

  const cashFilters = new Filters();
  const filterCache = new AppCache('cash-filters');

  // custom methods
  service.create = create;
  service.remove = Transactions.remove;
  service.calculateDisabledIds = calculateDisabledIds;
  service.formatCashDescription = formatCashDescription;
  service.openCancelCashModal = openCancelCashModal;
  service.checkCashPayment = checkCashPayment;
  service.filters = cashFilters;

  /**
   * Cash Payments can be made to multiple invoices.  This function loops
   * though the invoices in selected order, allocating the global amount to each
   * invoice until it is decimated.
   * @param data
   */
  function allocatePaymentAmounts(data) {
    // default to an empty array if necessary -- the server will throw an error
    const items = (data.invoices || [])

    // loop through the invoices, allocating a sum to the invoice until there
    // is no more left to allocate.
      .map((invoice) => {
        return { invoice_uuid : invoice.uuid };
      });

    return items;
  }

  /**
   * @function create
   * @description
   * Creates a cash payment from a JSON passed from a form.
   * @param {object} data A JSON object containing the cash payment record defn
   * @param payment
   * @returns {object} payment A promise resolved with the database uuid.
   */
  function create(payment) {
    // create a temporary copy to send to the server
    const data = angular.copy(payment);

    // ensure that the caution flag is a Number
    data.is_caution = Number(data.is_caution);

    // process the invoice item, allocating costs to each of them
    if (data.is_caution === 0) {
      data.items = allocatePaymentAmounts(data);
    }

    // remove data.invoices property before submission to the server
    delete data.invoices;

    // call the prototype create method with the formatted data
    return Api.create.call(service, { payment : data });
  }

  /*
   * Nicely format the cash payment description
   */
  /**
   *
   * @param patient
   * @param payment
   */
  function formatCashDescription(patient, payment) {
    const isCaution = payment.is_caution;

    // invoice references
    const invoicesReferences = payment.invoices.map((invoice) => {
      return invoice.reference;
    });

    // this must be semicolons, otherwise the CSV file breaks.
    const referencesString = invoicesReferences.join('; ');

    const tmpl = isCaution ? 'CASH.PREPAYMENT_DESCRIPTION' : 'CASH.PAYMENT_DESCRIPTION';

    return $translate.instant(tmpl, {
      patientName       : patient.display_name,
      invoiceReferences : referencesString,
      patientReference  : patient.reference,
      amount            : payment.amount,
    });
  }

  /**
   * @function calculateDisabledIds
   * @description
   * For a given cashbox, determine which currencies should be unsupported and
   * therefore disabled from selection.
   * @param {object} cashbox - the cashbox to read from.
   * @param {Array} currencies - a list of application currencies
   * @returns {Array} - the array of currency ids to disable
   */
  function calculateDisabledIds(cashbox, currencies) {
    // collect cashbox ids in an array
    const cashboxCurrencyIds = cashbox.currencies.reduce((array, currency) => {
      return array.concat(currency.currency_id);
    }, []);

    // find all ids that are not cashbox ids, to disable them
    const disabledCurrencyIds = currencies.reduce((array, currency) => {
      const bool = (cashboxCurrencyIds.indexOf(currency.id) === -1);
      return array.concat(bool ? currency.id : []);
    }, []);

    return disabledCurrencyIds;
  }

  cashFilters.registerDefaultFilters(bhConstants.defaultFilters);

  cashFilters.registerCustomFilters([
    { key : 'uuid', label : 'FORM.LABELS.REFERENCE' },
    { key : 'is_caution', label : 'FORM.LABELS.CAUTION', valueFilter : 'boolean' },
    { key : 'cashbox_id', label : 'FORM.LABELS.CASHBOX' },
    { key : 'project_id', label : 'FORM.LABELS.PROJECT' },
    { key : 'debtor_uuid', label : 'FORM.LABELS.CLIENT' },
    { key : 'user_id', label : 'FORM.LABELS.USER' },
    { key : 'reference', label : 'FORM.LABELS.REFERENCE' },
    {
      key : 'dateFrom', label : 'FORM.LABELS.DATE_FROM', comparitor : '>', valueFilter : 'date',
    },
    {
      key : 'dateTo', label : 'FORM.LABELS.DATE_TO', comparitor : '<', valueFilter : 'date',
    },
    { key : 'currency_id', label : 'FORM.LABELS.CURRENCY' },
    { key : 'reversed', label : 'CASH.REGISTRY.REVERSED_RECORDS', valueFilter : 'boolean' },
    { key : 'description', label : 'FORM.LABELS.DESCRIPTION' },
    { key : 'patientReference', label : 'FORM.LABELS.REFERENCE_PATIENT' },
    { key : 'defaultPeriod', label : 'TABLE.COLUMNS.PERIOD', valueFilter : 'translate' },
    { key : 'invoiceReference', label : 'FORM.LABELS.INVOICE' },
    { key : 'debtor_group_uuid', label : 'FORM.LABELS.DEBTOR_GROUP' },
    { key : 'invoice_uuid', label : 'FORM.LABELS.INVOICE' }]);

  if (filterCache.filters) {
    // load cached filter definition if it exists
    cashFilters.loadCache(filterCache.filters);
  }

  // once the cache has been loaded - ensure that default filters are provided appropriate values
  assignDefaultFilters();

  /**
   *
   */
  function assignDefaultFilters() {
    // get the keys of filters already assigned - on initial load this will be empty
    const assignedKeys = Object.keys(cashFilters.formatHTTP());

    // assign default period filter
    const periodDefined = service.util.arrayIncludes(assignedKeys, [
      'period', 'custom_period_start', 'custom_period_end',
    ]);

    if (!periodDefined) {
      cashFilters.assignFilters(Periods.defaultFilters());
    }

    // assign default limit filter
    if (assignedKeys.indexOf('limit') === -1) {
      cashFilters.assignFilter('limit', 100);
    }
  }

  service.removeFilter = function removeFilter(key) {
    cashFilters.resetFilterState(key);
  };

  // load filters from cache
  service.cacheFilters = function cacheFilters() {
    filterCache.filters = cashFilters.formatCache();
  };

  service.loadCachedFilters = function loadCachedFilters() {
    cashFilters.loadCache(filterCache.filters || {});
  };

  // downloads a the registry as a given type (pdf, csv)
  service.download = function download(type) {
    const filterOpts = cashFilters.formatHTTP();
    const defaultOpts = { renderer : type, lang : Languages.key };

    // combine options
    const options = angular.merge(defaultOpts, filterOpts);

    // return  serialized options
    return $httpParamSerializer(options);
  };

  /**
   * @description checkCashPayment the invoice from the database
   * @param {string} invoiceUuid, is the uuid of invoice
   * @param invoiceUuid
   * @example
   * service.checkCashPayment(invoiceUuid)
   * .then(function (res){
   *   your code here
   *  });
   */
  function checkCashPayment(invoiceUuid) {
    const url = urlCheckin + invoiceUuid;
    return service.$http.get(url)
      .then(service.util.unwrapHttpResponse);
  }

  // open a dialog box to Cancel Cash Payment
  /**
   *
   * @param cash
   */
  function openCancelCashModal(cash) {
    return Modal.open({
      templateUrl : 'modules/cash/modals/modal-cancel-cash.html',
      resolve     : { data : { cash } },
      size        : 'md',
      animation   : false,
      keyboard    : false,
      backdrop    : 'static',
      controller  : 'ModalCancelCashController as ModalCtrl',
    }).result;
  }

  return service;
}
