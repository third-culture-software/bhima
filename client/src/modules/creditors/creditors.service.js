angular.module('bhima.services')
  .service('CreditorService', CreditorService);

CreditorService.$inject = ['PrototypeApiService', 'CreditorGroupService'];

/**
 * Creditor Service
 *
 * This service implements CRUD operations for the /creditors API endpoint
 * @param Api
 * @param Groups
 */
function CreditorService(Api, Groups) {
  const service = Api('/creditors/');

  service.Groups = Groups;

  return service;
}
