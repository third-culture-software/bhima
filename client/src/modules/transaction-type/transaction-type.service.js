angular.module('bhima.services')
  .service('TransactionTypeService', TransactionTypeService);

TransactionTypeService.$inject = ['PrototypeApiService', '$translate'];

/**
 * @class TransactionTypeService
 *
 * @description
 * This service manages CRUD operations on transaction types.
 */
function TransactionTypeService(Api, $translate) {
  const service = new Api('/transaction_type/');

  function translateTransactionType(type) {
    type.plainText = $translate.instant(type.text);
  }

  function orderByTransactionType(typeA, typeB) {
    return typeA.plainText.localeCompare(typeB.plainText);
  }

  service.read = function read(...args) {
    return Api.read.apply(service, args)
      .then(types => {

        if (Array.isArray(types)) {
          // make sure that the transaction types are translated
          types
            .forEach(translateTransactionType);

          // sort them by their translated type
          types
            .sort(orderByTransactionType);
        }

        return types;
      });
  };

  return service;

}
