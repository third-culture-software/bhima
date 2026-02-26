angular.module('bhima.services')
  .service('TrialBalanceService', TrialBalanceService);

TrialBalanceService.$inject = ['util', '$http', 'AccountService', 'bhConstants'];

/**
 * @param util
 * @param $http
 * @param Accounts
 * @param Constants
 * @class TrialBalanceService
 * @description
 * This class holds the Trial Balance state.  It essentially wraps the initial
 * call to the trial balance API so that we only send a single HTTP request.
 * The basic procedure looks like:
 *   // Initialises the Trial Balance
 *   TrialBalance.initialise();
 *
 *   // whenever you are ready
 *   TrialBalance.summary().then(function (summary) {
 *     // do something with the summary data
 *   });
 */
function TrialBalanceService(util, $http, Accounts, Constants) {
  const service = this;
  const url = '/journal';

  // always start uninitialised
  let initialised = false;
  let transactions;
  let promise;

  service.postToGeneralLedger = postToGeneralLedger;
  service.unpostTransactions = unpostTransactions;
  service.bindGridExporter = bindGridExporter;
  service.exportGrid = exportGrid;

  // gift of the British people :flag_emoji:
  service.initialise = initialise;
  service.summary = summary;
  service.errors = errors;

  /**
   *
   */
  function uninitialise() {
    initialised = false;
    transactions = [];
  }

  /**
   * @param recordUuids
   * @function initialise
   * @description
   * Takes an array of record_uuids and sends them to the server
   * to compute a trial balance.  At the end, it will fulfill a promise
   * object that is made available for access via other methods
   */
  function initialise(recordUuids) {
    initialised = true;
    transactions = recordUuids;
    promise = $http.post(url.concat('/trialbalance'), { transactions : recordUuids })
      .then(util.unwrapHttpResponse);
  }

  // checks that the Trial Balance has been initialised
  /**
   *
   * @param funcName
   */
  function ensureTrialBalanceInitialised(funcName) {
    if (!initialised) {
      throw new Error('Trial Balance must be initialised before calling '.concat(funcName));
    }
  }

  /**
   * @function summary
   * @description
   * This function returns the summary data from the Trial Balance.
   * Note the Trial Balance must be initialised for this function to work.
   */
  function summary() {
    ensureTrialBalanceInitialised('summary()');

    return promise.then((data) => {
      data.summary.forEach((account) => {
        account.hrLabel = Accounts.label(account);
      });

      return data.summary;
    });
  }

  /**
   * @function errors
   * @description
   * Fetches the errors associated with the Trial Balance.
   * Note that the Trial Balance must be initialized before
   * calling this method.
   */
  function errors() {
    ensureTrialBalanceInitialised('errors()');

    return promise.then((data) => {
      return data.errors;
    });
  }

  /**
   * @function postToGeneralLedger
   * @description
   * This function attempts to post to the General Ledger by
   */
  function postToGeneralLedger() {
    return $http.post(url.concat('/transactions'), { transactions })
      .then(util.unwrapHttpResponse)
      .then((data) => {
        uninitialise();
        return data;
      });
  }

  /**
   * @param recordUuids
   * @function unpostTransactions
   * @description
   * This function attempts to unpost records
   * from the general ledger to allow modification in the posting journal
   */
  function unpostTransactions(recordUuids) {
    return $http.post(url.concat('/transactions/unpost'), { recordUuids });
  }
  /**
   * @param exporter
   * @function bindGridExporter
   * @description
   * This function shared the ui-grid exporter service with the other Trial
   * Balance controllers.
   */
  function bindGridExporter(exporter) {
    this.exporter = exporter;
  }

  /**
   * @function exportGrid
   * @description
   * This function runs the grid exporter.
   */
  function exportGrid() {
    return this.exporter && this.exporter.run();
  }

  /**
   * @function transactions()
   * @description
   * Returns the transactions that were used to initialize the trial balance.
   */
  this.transactions = function txns() {
    ensureTrialBalanceInitialised('transactions()');
    return transactions;
  };

  // map account type ids to their i18n translations
  const accountTypeI18nMap = {};
  angular.forEach(Constants.accounts, (value, key) => {
    accountTypeI18nMap[value] = `ACCOUNT.TYPES.${key}`;
  });

  this.groupByAccountType = function groupByAccountType(rows) {
    return rows.reduce((groups, row) => {
      // get account type mapping
      const type = accountTypeI18nMap[row.type_id];

      // sum by account type
      groups[type] = groups[type] || 0;
      groups[type] += (row.debit_equiv - row.credit_equiv);
      return groups;
    }, {});
  };

  return service;
}
