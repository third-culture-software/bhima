angular.module('bhima.services')
  .service('BarcodeService', BarcodeService);

BarcodeService.$inject = ['$http', 'util', '$uibModal'];

function BarcodeService($http, util, Modal) {
  const service = this;

  // TODO - barcode redirection
  service.redirect = angular.noop;

  service.search = function search(code) {
    return $http.get('/barcode/'.concat(code))
      .then(util.unwrapHttpResponse);
  };

  service.modal = (options = {}) => Modal.open({
    controller  : 'BarcodeModalController as BarcodeModalCtrl',
    templateUrl : 'modules/templates/barcode-scanner-modal.html',
    size        : 'lg',
    backdrop    : 'static',
    keyboard    : true,
    resolve : {
      options : () => options,
    },
  }).result;

  return service;
}
