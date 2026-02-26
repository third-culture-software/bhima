angular.module('bhima.services')
  .service('FindEntityService', FindEntityService);

FindEntityService.$inject = ['$uibModal', 'PrototypeApiService'];

/**
 *
 * @param Modal
 * @param Api
 */
function FindEntityService(Modal, Api) {
  const service = new Api('/finance/entities/');

  service.openModal = openModal;

  /**
   *
   */
  function openModal() {
    const instance = Modal.open({
      templateUrl  : 'modules/templates/modals/findEntity.modal.html',
      controller   : 'FindEntityModalController',
      controllerAs : '$ctrl',
      size         : 'md',
      animation    : true,
    });

    return instance.result;
  }

  return service;
}
