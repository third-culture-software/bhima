angular.module('bhima.services')
  .service('AccountCategoryService', AccountCategoryService);

AccountCategoryService.$inject = ['PrototypeApiService'];

/**
* Account Category Service
*
* A service wrapper for the /account/categories HTTP endpoint.
*/
function AccountCategoryService(Api) {
  return new Api('/accounts/categories/');
}
