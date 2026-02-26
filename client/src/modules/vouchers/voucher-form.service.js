angular.module('bhima.services')
  .service('VoucherForm', VoucherFormService);

VoucherFormService.$inject = [
  'VoucherService', 'bhConstants', 'SessionService', 'VoucherItemService',
  'AppCache', 'Store', 'AccountService', '$timeout', '$translate',
  'ExchangeRateService', 'FormatTreeDataService',
];

/**
 * @param Vouchers
 * @param Constants
 * @param Session
 * @param VoucherItem
 * @param AppCache
 * @param Store
 * @param Accounts
 * @param $timeout
 * @param $translate
 * @param Exchange
 * @param FormatTreeData
 * @class VoucherFormService
 * @description
 * This wraps the journal voucher form and provides additional validators
 * customized for the rules of double entry accounting.  It also provides
 * functionality for efficiently calculating totals.
 * @todo - finish the caching implementation
 */
function VoucherFormService(
  Vouchers, Constants, Session, VoucherItem, AppCache, Store, Accounts,
  $timeout, $translate, Exchange, FormatTreeData,
) {
  // Error Flags
  // must have transaction_type for certain cases
  const ERROR_MISSING_TRANSACTION_TYPE = 'TRANSACTIONS.MISSING_TRANSACTION_TYPE';
  // must have sum(debits) === sum(credits)
  const ERROR_IMBALANCED_TRANSACTION = 'TRANSACTIONS.IMBALANCED_TRANSACTION';
  // must have > 1 unique accounts
  const ERROR_SINGLE_ACCOUNT_TRANSACTION = 'TRANSACTIONS.SINGLE_ACCOUNT_TRANSACTION';
  // must have > 1 rows
  const ERROR_SINGLE_ROW_TRANSACTION = 'TRANSACTIONS.SINGLE_ROW_TRANSACTION';

  // applied to the reduce
  /**
   *
   * @param aggregates
   * @param row
   */
  function sumDebitsAndCredits(aggregates, row) {
    aggregates.debit += row.debit || 0;
    aggregates.credit += row.credit || 0;
    return aggregates;
  }

  /**
   * @function calculateItemTotals
   * @param {Array} items - the array of voucher items
   * @returns {object} - totals object with aggregate debit and credit
   * @description
   * This function loops through the items and aggregates the debits and credits
   * into an aggregate object.
   */
  function calculateItemTotals(items) {
    return items.reduce(sumDebitsAndCredits, { debit : 0, credit : 0 });
  }

  /**
   * @param cacheKey
   * @class
   */
  function VoucherForm(cacheKey) {
    if (!cacheKey) {
      throw new Error('VoucherForm expected a cacheKey, but it was not provided.');
    }

    // bind the cache key
    this.cache = AppCache(cacheKey);

    // this is the overarching details of the voucher to be filled in
    this.details = {};

    Accounts.read()
      .then((accounts) => {
        this.accounts = FormatTreeData.order(accounts);
      });

    // this will contain the grid rows
    this.store = new Store({ identifier : 'uuid', data : [] });

    // run the setup function
    this.setup();
  }

  /**
   * @function validate
   * @description
   * This function is called on the journal voucher items to run validation
   * checks against each item, returning the global validation state.  If there
   * is an error in any single line item, that error is set on the form.
   */
  VoucherForm.prototype.validate = function validate() {
    const items = this.store.data;

    let err;

    // calculate the totals for the data
    this.totals = calculateItemTotals(items);

    // this array will store unique accounts
    const uniqueAccountsArray = [];

    // this will store the validity condition.  We could use array.every() but it
    // seems like Chrome greedily exits if a false condition is it.
    let valid = true;

    // loop through each row, checking the amounts and accounts of each item.
    items.forEach(item => {
      valid = valid && item.validate();

      // if the row has an error, save it as the form error
      if (item._error) {
        err = item._error;
      }

      // only test for unique accounts if there are valid accounts selected
      if (item.account_id) {
        // if there unique accounts array does not have this account, add it.
        if (!uniqueAccountsArray.includes(item.account_id)) {
          uniqueAccountsArray.push(item.account_id);
        }
      }
    });

    // validate that the type_id are set
    const hasTypeId = angular.isDefined(this.details.type_id);
    if (!hasTypeId) {
      err = ERROR_MISSING_TRANSACTION_TYPE;
    }

    // validate that the number of rows in the grid is > 1
    const hasEnoughRows = (items.length > 1);
    if (!hasEnoughRows) {
      err = ERROR_SINGLE_ROW_TRANSACTION;
    }

    // validate that this uses multiple accounts in the transaction

    // To prevent calling the validation function when selecting the transaction type before selecting accounts
    const hasNullAccounts = (uniqueAccountsArray.length === 0);

    if (!hasNullAccounts) {
      const hasUniqueAccounts = (uniqueAccountsArray.length > 1);
      if (!hasUniqueAccounts) {
        err = ERROR_SINGLE_ACCOUNT_TRANSACTION;
      }

      // validate that total debit equals to total credit
      const totalDebit = Number(this.totals.debit).toFixed(4);
      const totalCredit = Number(this.totals.credit).toFixed(4);
      const hasBalancedDebitsAndCredits = (totalDebit === totalCredit);
      if (!hasBalancedDebitsAndCredits) {
        err = ERROR_IMBALANCED_TRANSACTION;
      }

      // attach error to the form
      this._error = err;

      // return the boolean condition to the caller
      return (valid && hasUniqueAccounts && hasEnoughRows && hasBalancedDebitsAndCredits);
    }

    // attach error to the form
    this._error = err;

    return valid && hasEnoughRows;
  };

  /**
   * @function setup
   * @description
   * This function initializes the journal voucher form with data.  By default,
   * two lines are always present in the form.
   */
  VoucherForm.prototype.setup = function setup() {
    this.details = {};

    this.details.date = new Date();
    this.details.project_id = Session.project.id;
    this.details.currency_id = Session.enterprise.currency_id;
    this.details.user_id = Session.user.id;

    this.addItems(2);
  };

  // this is called whenever a change is made to the grid
  VoucherForm.prototype.onChanges = function onChanges() {
    this.validate();
  };

  VoucherForm.prototype.configureRow = function configureRow(row) {
    row.configure(row);
  };

  VoucherForm.prototype.onDateChange = function onDateChange(date) {
    this.details.date = date;
  };

  VoucherForm.prototype.description = function description(key, options) {
    this.details.description = $translate.instant(key, options);
  };

  // set account on row
  VoucherForm.prototype.setAccountOnRow = function setAccountOnRow(row, accountId) {
    row.configure({ account_id : accountId });
  };

  /**
   * @function addItems
   * @description
   * Adds an item to the voucher grid.  This function is called when from the
   * view to add an uninitialized item into the voucher ui-grid.
   * @param {number} n - the number of items to add to the grid
   */
  VoucherForm.prototype.addItems = function addItems(n) {
    let i = n;
    while (i--) {
      this.store.post(new VoucherItem());
    }
  };

  /**
   * @param uuid
   * @function removeItem
   * @description
   * This method removes an item from the ui-grid by its uuid.
   */
  VoucherForm.prototype.removeItem = function removeItem(uuid) {
    return this.store.remove(uuid);
  };

  /**
   * @function clear
   * @description
   * This method clears the entire grid, removing all items from the grid.
   */
  VoucherForm.prototype.clear = function clear() {
    this.store.clear();

    // directly running setup after clear adds the voucher items that have been
    // removed from the store, wrapping these methods in a timeout ensures they
    // are no longer in use by the ui-grid data object
    $timeout(() => {
      this.setup();

      // validate() is only set up to test on submission as it checks the validity
      // of individual items which will not have been configured, manually
      // reset error state
      delete this._error;
    });
  };

  /**
   * @param rows
   * @function replaceFormRows
   */
  VoucherForm.prototype.replaceFormRows = function replaceFormRows(rows) {

    this.clear();

    rows.forEach(row => {
      this.addItems(1);

      const lastRowIdx = this.store.data.length - 1;
      const lastRow = this.store.data[lastRowIdx];

      lastRow.configure(row);
    });

    this.validate();
  };

  /**
   * @function writeCache
   * @description
   * This method writes values from the voucher into the application cache for
   * later recovery.
   */
  VoucherForm.prototype.writeCache = function writeCache() {
    this.cache.details = this.details;
    this.cache.items = angular.copy(this.store.data);
  };

  /**
   * @function clearCache
   * @description
   * This method deletes the items from the application cache.
   */
  VoucherForm.prototype.clearCache = function clearCache() {
    delete this.cache.details;
    delete this.cache.items;
  };

  /**
   * @function hasCacheAvailable
   * @description
   * Checks to see if the invoice has cached items to recover.
   */
  VoucherForm.prototype.hasCacheAvailable = function hasCacheAvailable() {
    return Object.keys(this.cache).length > 0;
  };

  /**
   * @function handleCurrencyChange
   * @description
   * Handles the exchange operation for the voucher form - if on currency change,
   * the user wants the values to update, they will overwrite the user created
   * values.
   * @param {number} nextCurrencyId - the currency id that will replace the
   *   current currency id.
   * @param {number} shouldConvertValues - tells the function to replace the
   *   values with a new converted values.
   */
  VoucherForm.prototype.handleCurrencyChange = function handleCurrencyChange(nextCurrencyId, shouldConvertValues) {
    if (shouldConvertValues) {
      const enterpriseCurrencyId = Session.enterprise.currency_id;
      const isEnterpriseCurrency = (enterpriseCurrencyId === nextCurrencyId);

      const previousCurrencyId = this.details.currency_id;
      const { date } = this.details;

      const rate = isEnterpriseCurrency
        ? 1 / Exchange.getExchangeRate(previousCurrencyId, date)
        : Exchange.getExchangeRate(nextCurrencyId, date);

      const conversionFn = (value) => Exchange.round(rate * value);
      const rows = this.store.data;

      rows.forEach(row => {
        row.credit = conversionFn(row.credit || 0);
        row.debit = conversionFn(row.debit || 0);
      });

      // set current currency the selected currency
      this.details.currency_id = nextCurrencyId;
    }

    this.validate();
  };

  return VoucherForm;
}
