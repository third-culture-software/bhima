angular.module('bhima.services')
  .service('FundingSourceService', FundingSourceService);

FundingSourceService.$inject = ['PrototypeApiService', 'util', '$uibModal'];

/**
 * @class FundingSourceService
 * @extends PrototypeApiService
 *
 * @description
 * Encapsulates common requests to the /funding_sources/ URL.
 */
function FundingSourceService(Api, util, $uibModal) {
  const baseUrl = '/funding_sources/';
  const service = new Api(baseUrl);

  service.createUpdateFundingSourcesModal = (fundingSource) => {
    return $uibModal.open({
      templateUrl : 'modules/fundingSources/modal/createUpdate.html',
      controller : 'FundingSourcesModalController as ModalCtrl',
      resolve : { data : () => fundingSource },
    });
  };

  return service;
}
