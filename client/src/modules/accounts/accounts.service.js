angular.module('bhima.services')
  .service('AccountService', AccountService);

AccountService.$inject = [
  'PrototypeApiService', 'bhConstants', 'HttpCacheService',
];

/**
 * @class AccountService
 * @extends PrototypeApiService
 *
 * @description
 * A service wrapper for the /accounts HTTP endpoint.
 */
function AccountService(Api, bhConstants, HttpCache) {
  const baseUrl = '/accounts/';
  const service = new Api(baseUrl);

  // debounce the read() method by 250 milliseconds to avoid needless GET requests service.read = read;
  service.read = read;
  service.label = label;
  service.typeToken = typeToken;

  service.getBalance = getBalance;
  service.getAnnualBalance = getAnnualBalance;
  service.getAllAnnualBalances = getAllAnnualBalances;
  service.getOpeningBalanceForPeriod = getOpeningBalanceForPeriod;
  service.filterTitleAccounts = filterTitleAccounts;
  service.filterAccountByType = filterAccountsByType;
  service.downloadAccountsTemplate = downloadAccountsTemplate;
  service.redCreditCell = redCreditCell;
  service.isIncomeOrExpenseAccountTypeId = isIncomeOrExpenseAccountTypeId;

  /**
   * @method getOpeningBalance
   *
   *
   * @description
   * This method exists to get the opening balance for parameters like those
   * used to load a date range.
   */
  function getOpeningBalanceForPeriod(id, options) {
    const url = service.url.concat(id, '/openingBalance');
    return service.$http.get(url, { params : options })
      .then(service.util.unwrapHttpResponse);
  }

  const callback = (id, options) => Api.read.call(service, id, options);
  const fetcher = HttpCache(callback);

  /**
   * The read() method loads data from the api endpoint. If an id is provided,
   * the $http promise is resolved with a single JSON object, otherwise an array
   * of objects should be expected.
   *
   * @param {Number} id - the id of the account to fetch (optional).
   * @param {Object} options - options to be passed as query strings (optional).
   * @param {Boolean} cacheBust - ignore the cache and send the HTTP request directly
   *   to the server.
   * @return {Promise} promise - resolves to either a JSON (if id provided) or
   *   an array of JSONs.
   */
  function read(id, options, cacheBust = false) {
    return fetcher(id, options, cacheBust)
      .then(handleAccounts);
  }

  function handleAccounts(accounts) {
    // if we received an array of accounts from the server,
    // label the accounts with a nice human readable label
    if (angular.isArray(accounts)) {
      accounts.forEach(humanReadableLabel);
    }

    return accounts;
  }

  function humanReadableLabel(account) {
    account.hrlabel = label(account);
  }

  function label(account) {
    return String(account.number).concat(' - ', account.label);
  }

  function typeToken(typeId) {
    const typeName = Object.keys(bhConstants.accounts).find(key => bhConstants.accounts[key] === typeId);
    const token = typeName ? `ACCOUNT.TYPES.${typeName}` : '';
    return token;
  }

  function getBalance(accountId, opt = {}) {
    const url = baseUrl.concat(accountId, '/balance');
    return service.$http.get(url, { params : opt })
      .then(service.util.unwrapHttpResponse);
  }

  function getAnnualBalance(accountId, fiscalYearId, opt = {}) {
    const url = baseUrl.concat(accountId, '/balance/', fiscalYearId);
    return service.$http.get(url, { params : opt })
      .then(service.util.unwrapHttpResponse);
  }

  function getAllAnnualBalances(fiscalYearId) {
    const url = baseUrl.concat(fiscalYearId, '/all_balances');
    return service.$http.get(url)
      .then(service.util.unwrapHttpResponse);
  }

  function filterTitleAccounts(accounts) {
    return filterAccountsByType(accounts, bhConstants.accounts.TITLE);
  }

  function filterAccountsByType(accounts, type) {
    return accounts.filter(account => account.type_id !== type);
  }

  // return true if the account is an income or expense
  function isIncomeOrExpenseAccountTypeId(typeId) {
    return [bhConstants.accounts.INCOME, bhConstants.accounts.EXPENSE].includes(typeId);
  }

  /**
   * @method downloadAccountsTemplate
   *
   * @description
   * Download the template file for importing accounts
   */
  function downloadAccountsTemplate() {
    const url = baseUrl.concat('template');
    return service.$http.get(url)
      .then(response => {
        return service.util.download(response, 'Import Accounts Template', 'csv');
      });
  }

  function redCreditCell(key, currencyId) {
    return `
      <div class="ui-grid-cell-contents text-right" ng-show="row.entity['${key}'] < 0">
        <span class='text-danger'>({{row.entity['${key}']*(-1) | currency:${currencyId}}})</span>
      </div>
      <div class="ui-grid-cell-contents text-right" ng-show="row.entity['${key}'] >= 0">
        {{row.entity['${key}'] | currency:${currencyId}}}
      </div>
    `;
  }

  return service;
}
