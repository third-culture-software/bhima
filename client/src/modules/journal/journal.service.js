angular.module('bhima.services')
  .service('JournalService', JournalService);

JournalService.$inject = [
  'PrototypeApiService', 'AppCache', 'FilterService', 'PeriodService',
  '$uibModal', 'bhConstants', 'TransactionService',
];

/**
 * Journal Service
 * @param Api
 * @param AppCache
 * @param Filters
 * @param Periods
 * @param Modal
 * @param bhConstants
 * @param Transactions
 * @description
 * This service is responsible for powering the Posting/Posted Journal grid.  It
 * also includes methods to open associated modals.
 */
function JournalService(Api, AppCache, Filters, Periods, Modal, bhConstants, Transactions) {
  const URL = '/journal/';
  const service = new Api(URL);

  service.grid = grid;
  service.saveChanges = saveChanges;
  service.openSearchModal = openSearchModal;
  service.openTransactionEditModal = openTransactionEditModal;
  service.mapTransactionIdsToRecordUuids = mapTransactionIdsToRecordUuids;
  service.getTransactionEditHistory = getTransactionEditHistory;

  /**
   * Standard API read method, as this will be used to drive the journal grids
   * this method will always request aggregate information
   * @param id
   * @param parameters
   */
  function grid(id, parameters) {
    const gridOptions = angular.extend({ aggregates : 1 }, parameters);
    return this.read(id, gridOptions);
  }

  /**
   * @param data
   * @function mapTransactionIdsToRecordUuids
   * @description
   * Helper method to map transaction ids to record uuids.
   */
  function mapTransactionIdsToRecordUuids(data) {
    return data.reduce(_mapTransactionIdsToRecordUuids, {});
  }

  /**
   * @param mapping
   * @param row
   * @function _mapTransactionIdsToRecordUuids
   * @description
   * Internal method that is passed to the reduce() function.  It is separated for
   * performance reasons.
   */
  function _mapTransactionIdsToRecordUuids(mapping, row) {
    mapping[row.trans_id] = row.record_uuid;
    return mapping;
  }

  // @TODO(sfount) change this API to (change pending to not break current functionality):
  //                - transaction uuid
  //                - changes (object)
  //                - new rows (array)
  //                - removed rows (array)
  /**
   *
   * @param entity
   * @param changes
   */
  function saveChanges(entity, changes) {
    const added = angular.copy(entity.newRows);

    // format request for server
    const saveRequest = {
      changed : changes,
      added   : sanitiseNewRows(added),
      removed : entity.removedRows,
    };

    return service.$http.post(`/journal/${entity.uuid}/edit`, saveRequest)
      .then(service.util.unwrapHttpResponse);
  }

  // @TODO(sfount) new rows will need to access the transaction shared attribute
  //               `trans_id_reference_number. This is currently ignored by the API.
  /**
   *
   * @param rows
   */
  function sanitiseNewRows(rows) {
    rows.data.forEach((row) => {
      // delete view data required by journal grid
      delete row.transaction;
      delete row.hrRecord;
      delete row.currencyName;
      delete row.project_name;
      delete row.display_name;
      delete row.posted;
      delete row.account_type_id;
    });

    return rows.data;
  }

  // set up base filters
  const filterCache = new AppCache('journal-filters');
  const journalFilters = new Filters();

  service.filters = journalFilters;

  // default filters will always be applied
  journalFilters.registerDefaultFilters(bhConstants.defaultFilters);
  journalFilters.registerDefaultFilters([
    { key : 'showFullTransactions', label : 'POSTING_JOURNAL.SHOW_FULL_TRANSACTION_RECORDS' },
  ]);

  // custom filters can be optionally applied
  journalFilters.registerCustomFilters([
    { key : 'trans_id', label : 'FORM.LABELS.TRANS_ID' },
    { key : 'record_uuid', label : 'FORM.LABELS.TRANS_ID' },
    { key : 'reference', label : 'FORM.LABELS.REFERENCE' },
    { key : 'user_id', label : 'FORM.LABELS.USER' },
    { key : 'currency_id', label : 'FORM.LABELS.CURRENCY' },
    { key : 'account_id', label : 'FORM.LABELS.ACCOUNT' },
    { key : 'account_type_id', label : 'FORM.LABELS.ACCOUNT_TYPE' },
    { key : 'amount', label : 'FORM.LABELS.AMOUNT' },
    { key : 'project_id', label : 'FORM.LABELS.PROJECT' },
    { key : 'description', label : 'FORM.LABELS.DESCRIPTION' },
    { key : 'includeNonPosted', label : 'TRANSACTIONS.INCLUDE_POSTED_TRANSACTIONS_SHORT' },
    { key : 'transaction_type_id', label : 'FORM.LABELS.TRANSACTION_TYPE' },
    { key : 'hrRecord', label : 'TABLE.COLUMNS.RECORD' },
    { key : 'hrReference', label : 'TABLE.COLUMNS.REFERENCE' },
    { key : 'hrEntity', label : 'TABLE.COLUMNS.RECIPIENT' },
    { key : 'comment', label : 'FORM.LABELS.COMMENT' },
    { key : 'stockReference', label : 'FORM.LABELS.REFERENCE_STOCK_MOVEMENT' },
    { key : 'showOnlyNullCostCenter', label : 'TRANSACTIONS.NO_COST_CENTER_TRANSACTION' },
    { key : 'cost_center_id', label : 'COST_CENTER.TITLE' },
  ]);

  if (filterCache.filters) {
    // load cached filter definition if it exists
    journalFilters.loadCache(filterCache.filters);
  }

  // once the cache has been loaded - ensure that default filters are provided appropriate values
  assignDefaultFilters();

  /**
   *
   */
  function assignDefaultFilters() {
    // get the keys of filters already assigned - on initial load this will be empty
    const assignedKeys = Object.keys(journalFilters.formatHTTP());

    // assign default period filter
    const periodDefined = service.util.arrayIncludes(
      assignedKeys,
      ['period', 'custom_period_start', 'custom_period_end'],
    );

    if (!periodDefined) {
      journalFilters.assignFilters(Periods.defaultFilters());
    }

    // assign default limit filter
    if (assignedKeys.indexOf('limit') === -1) {
      journalFilters.assignFilter('limit', 100);
    }

    if (assignedKeys.indexOf('showFullTransactions') === -1) {
      journalFilters.assignFilter('showFullTransactions', 0);
    }
  }

  service.removeFilter = function removeFilter(key) {
    journalFilters.resetFilterState(key);
  };

  // load filters from cache
  service.cacheFilters = function cacheFilters() {
    filterCache.filters = journalFilters.formatCache();
  };

  service.loadCachedFilters = function loadCachedFilters() {
    journalFilters.loadCache(filterCache.filters || {});
  };

  /**
   * @function openSearchModal
   * @param {object} filters
   * @param {object} options - { hasDefaultAccount: true } define other options
   */
  function openSearchModal(filters, options) {
    return Modal.open({
      templateUrl : 'modules/journal/modals/search.modal.html',
      controller :  'JournalSearchModalController as ModalCtrl',
      backdrop : 'static',
      resolve : {
        filters : () => filters,
        options : () => options || {},
      },
    }).result;
  }

  // @TODO(sfount) move this to a service that can easily be accessed by any
  // module that will show a transactions details.
  /**
   *
   * @param transactionUuid
   * @param readOnly
   */
  function openTransactionEditModal(transactionUuid, readOnly) {
    return Modal.open({
      templateUrl : 'modules/journal/modals/editTransaction.modal.html',
      controller : 'JournalEditTransactionController as ModalCtrl',
      backdrop : 'static',
      keyboard : false,
      size : 'lg',
      resolve : {
        transactionUuid : () => transactionUuid,
        readOnly : () => readOnly,
      },
    }).result;
  }

  // load the edit history of a particular transaction
  /**
   *
   * @param uuid
   */
  function getTransactionEditHistory(uuid) {
    return Transactions.history(uuid);
  }

  return service;
}
