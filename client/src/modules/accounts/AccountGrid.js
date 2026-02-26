angular.module('bhima.services')
  .service('AccountGridService', AccountGridService);

AccountGridService.$inject = [
  'AccountStoreService', 'AccountService', 'LanguageService',
  '$httpParamSerializer', 'FormatTreeDataService',
];

/**
 * @param AccountStore
 * @param Accounts
 * @param Languages
 * @param $httpParamSerializer
 * @param FormatTreeData
 * @class AccountGridService
 * @description
 * This service is responsible for collecting data required to populate the
 * Account Management module, it also provides helper methods for dynamically
 * adding and removing data.
 */
function AccountGridService(AccountStore, Accounts, Languages, $httpParamSerializer,
  FormatTreeData) {
  /**
   * @class
   * @description
   * Initialises a new Account Grid object, setting default values
   */
  function AccountGrid() {
    this._store = null;

    // exposed variables
    this.data = null;
  }

  /**
   * @param importedAccounts
   * @function settup
   * @description
   * Requests the latest account list from the AccountStore service and updates loading variables
   */
  AccountGrid.prototype.settup = function settup(importedAccounts) {
    // Fetch initial set of accounts
    return AccountStore.accounts(importedAccounts)
      .then(result => {
        this._store = result;
        // order and expose data made available through the store
        this.formatStore();
        // update exposed store driven data
        this.data = angular.copy(this._store.data);
      });
  };

  AccountGrid.prototype.download = function download(type, filters) {
    const filterOpts = filters;
    const defaultOpts = { renderer : type, lang : Languages.key, rowsDataKey : 'accounts' };

    // combine options
    const options = angular.merge(defaultOpts, filterOpts);

    // return  serialized options
    return $httpParamSerializer(options);
  };

  AccountGrid.prototype.formatStore = function formatStore() {
    // sort underlying data to ensure it is ordered by number - this is how it
    // is sent from the server by default
    this._store.data.sort(orderByNumber);

    // ensure data respects groups
    this._store.data = FormatTreeData.order(this._store.data);

    this._store.recalculateIndex();
  };

  /**
   *
   * @param a
   * @param b
   */
  function orderByNumber(a, b) {
    return a.number - b.number;
  }

  AccountGrid.prototype.updateViewInsert = function updateViewInsert(event, account) {
    account.number = Number(account.number);
    account.type_id = Number(account.type_id);
    account.hrlabel = Accounts.label(account);

    // update local store
    this._store.post(account);
    this.formatStore();
    const insertedIndex = this._store.index[account.id];

    // live update the grid data - this does not require the grid to redraw and
    // maintains the expand/ collapse states
    this.insertDifference(account, insertedIndex);
  };

  AccountGrid.prototype.updateViewDelete = function updateViewDelete(event, account) {
    // Update the store for other modules accessing it
    const removeIndex = this._store.index[account.id];
    this._store.remove(account.id);
    this.formatStore();

    // Update this grid
    this.data.splice(removeIndex, 1);
  };

  /**
   * @function updateViewEdit
   * @description
   * This method updates an account in the current store based on edits passed
   * in from the account update state. If the parent has changed it will request
   * that the grid updates the store with new data, otherwise an in-line change
   * can be made.
   * @param {Event}   event   Angular $broadcast event
   * @param {object}  account The udpated account object
   * @returns {boolean} This value reflects if the Grid must be refreshed or not
   */
  AccountGrid.prototype.updateViewEdit = function updateViewEdit(event, account) {
    const storeRecord = this._store.get(account.id);
    const parentHasChanged = account.parent !== storeRecord.parent;

    account.hrlabel = Accounts.label(account);
    angular.extend(storeRecord, account);

    if (parentHasChanged) {
      this.formatStore();

      // this will invalidate the any references to the services data up to this point
      this.data = angular.copy(this._store.data);
      return true;
    }

    // only semantic information about the account has changed - override the current account
    this.data.splice(this._store.index[account.id], 1, storeRecord);
    return false;
  };

  AccountGrid.prototype.insertDifference = function insertDifference(account, index) {
    this.data = this.data || [];
    this.data.splice(index, 0, account);
  };

  // look up an account by it's id
  AccountGrid.prototype.lookup = function lookup(id) {
    return this._store.get(id);
  };

  AccountGrid.prototype.filterHiddenAccounts = function filterHiddenAccounts(showHiddenAccounts) {
    const arr = this._store.data;

    // either filter out hidden accounts or passthrough
    const passthrough = () => true;
    const filterFn = showHiddenAccounts
      ? passthrough
      : account => account.hidden === 0;

    // we want to replace the whole array, so choose the max
    // if we use a length that is too short, we will leave some behind
    // if we pick a length that is greater, JS just expands the array
    const len = Math.max(arr.length, this.data.length);

    // cheekily filters the data in place - thanks stack overflow
    this.data.splice(0, len, ...arr.filter(filterFn));
  };

  return AccountGrid;
}
