angular.module('bhima.services')
  .service('TagService', TagService);

TagService.$inject = ['PrototypeApiService', 'util', '$uibModal'];

/**
 * @param Api
 * @param util
 * @param $uibModal
 * @class TagService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /tags/ URL.
 */
function TagService(Api, util, $uibModal) {
  const baseUrl = '/tags/';
  const tagKeys = ['uuid', 'name', 'color'];
  const service = new Api(baseUrl);

  service.types = new Api(baseUrl.concat('types/'));

  service.clean = tag => util.maskObjectFromKeys(tag, tagKeys);

  service.createUpdateTagsModal = (tag) => {
    $uibModal.open({
      templateUrl : 'modules/tags/modal/createUpdate.html',
      controller : 'TagsModalController as ModalCtrl',
      resolve : { data : () => tag },
    });
  };

  return service;
}
