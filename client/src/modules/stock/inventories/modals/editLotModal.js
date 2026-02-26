angular.module('bhima.controllers')
  .controller('EditLotModalController', EditLotModalController);

// dependencies injections
EditLotModalController.$inject = [
  'data', 'LotService',
  'NotifyService', '$uibModalInstance',
];

/**
 *
 * @param data
 * @param LotService
 * @param Notify
 * @param Instance
 */
function EditLotModalController(data, LotService, Notify, Instance) {
  const vm = this;
  vm.uuid = data.uuid;

  // let get the lot details
  LotService.read(vm.uuid).then(lot => {
    vm.lot = lot;
  }).catch(Notify.handleError);

  vm.cancel = () => Instance.close();

}
