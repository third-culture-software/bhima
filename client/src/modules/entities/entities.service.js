angular.module('bhima.services')
  .service('EntityService', EntityService);

EntityService.$inject = ['PrototypeApiService', 'util'];

/**
 * @param Api
 * @param util
 * @class EntityService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /entities/ URL.
 */
function EntityService(Api, util) {
  const baseUrl = '/entities/';
  const service = new Api(baseUrl);
  service.types = new Api(baseUrl.concat('types/'));

  const entityKeys = ['uuid', 'display_name', 'title', 'gender', 'email', 'phone', 'address', 'entity_type_id'];
  service.clean = entity => util.maskObjectFromKeys(entity, entityKeys);

  return service;
}
