angular.module('bhima.services')
  .service('AccountTypeService', AccountTypeService);

AccountTypeService.$inject = ['PrototypeApiService', '$http', 'util'];

/**
* Account Type Service
*
* A service wrapper for the /account_types HTTP endpoint.
*/
function AccountTypeService(Api, $http, util) {
  const baseUrl = '/accounts/types/';
  const service = new Api(baseUrl);

  service.getTypeText = getTypeText;

  /**
  * @helper
  * This Method return a text an Account Type
  * */
  function getTypeText(typeId, accountTypes) {
    const needle = accountTypes.find(item => item.id === typeId);
    return needle.type;
  }

  return service;
}
