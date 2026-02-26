angular.module('bhima.services')
  .service('TransactionTypeStoreService', TransactionTypeStoreService);

TransactionTypeStoreService.$inject = ['$q', 'TransactionTypeService', 'Store'];

/**
 * Transaction Type Store Controller
 * @param $q
 * @param TransactionType
 * @param Store
 */
function TransactionTypeStoreService($q, TransactionType, Store) {
  const service = this;
  const data = new Store();
  let initialLoad = true;

  service.load = transactionTypeStore;
  service.refresh = refresh;

  /**
   *
   */
  function refresh() {
    TransactionType.read()
      .then(result => {
        data.setData(result);
      });
  }

  /**
   *
   */
  function transactionTypeStore() {
    const request = TransactionType.read()
      .then((result) => {
        data.setData(result);
        initialLoad = false;
        return data;
      });

    return initialLoad ? request : $q.resolve(data);
  }
}
