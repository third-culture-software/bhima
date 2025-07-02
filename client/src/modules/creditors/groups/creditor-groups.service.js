angular.module('bhima.services')
  .service('CreditorGroupService', CreditorGroupService);

CreditorGroupService.$inject = ['PrototypeApiService'];

/**
* Creditor Group Service
*
* This service implements CRUD operations for the /creditor-groups API endpoint
*/
function CreditorGroupService(Api) {
  const service = Api('/creditors/groups/');
  return service;
}
