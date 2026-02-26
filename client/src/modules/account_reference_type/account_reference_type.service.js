angular.module('bhima.services')
  .service('AccountReferenceTypeService', AccountReferenceTypeService);

AccountReferenceTypeService.$inject = ['PrototypeApiService', '$translate'];

/**
 * @param Api
 * @param $translate
 * @class AccountReferenceTypeService
 * @augments PrototypeApiService
 * @description
 * Encapsulates common requests to the /account_reference_type/ URL.
 */
function AccountReferenceTypeService(Api, $translate) {
  const service = new Api('/account_reference_type/');

  service.translateLabel = translateLabel;

  const label = item => {
    item.label = $translate.instant(item.label);
  };

  /**
   *
   * @param data
   */
  function translateLabel(data) {
    data.forEach(label);
    return data;
  }

  return service;
}
