/** @todo
 *  cache service should be able to be defined with the following
 *  - function to use to populate the store
 *  - store to use
 */
angular.module('bhima.services')
  .service('AccountStoreService', AccountStoreService);

AccountStoreService.$inject = [
  '$q', 'AccountService', 'AccountTypeService', 'Store',
];

// Temporary service until caching API services is well designed
function AccountStoreService($q, Accounts, AccountTypes, Store) {
  const service = this;
  let initialLoad = true;
  let initTypeLoad = true;

  service.accounts = accountStore;
  service.types = typeStore;

  const accounts = new Store();
  const accountTypes = new Store();

  const typeRequest = AccountTypes.read()
    .then((result) => {
      accountTypes.setData(result);
      initTypeLoad = false;
      return accountTypes.data;
    });

  function accountStore(importedAccounts) {
    if (importedAccounts || initialLoad) {
      return Accounts.read(null, { detailed: 1 }, true)
        .then((result) => {
          accounts.setData(result);
          initialLoad = false;
          return $q.resolve(accounts);
        });
    }

    return $q.resolve(accounts);
  }

  function typeStore() {
    if (initTypeLoad) {
      return typeRequest.then(() => {
        return accountTypes;
      });
    }

    return $q.resolve(accountTypes);
  }
}
