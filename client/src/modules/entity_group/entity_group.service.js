angular.module('bhima.services')
  .service('EntityGroupService', EntityGroupService);

EntityGroupService.$inject = ['PrototypeApiService', 'util'];

/**
 * @param Api
 * @class EntityGroupService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /entities/groups/ URL.
 */
function EntityGroupService(Api) {
  const baseUrl = '/entities/groups/';
  const service = new Api(baseUrl);
  return service;
}
