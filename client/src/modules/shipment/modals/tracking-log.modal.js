angular.module('bhima.controllers')
  .controller('UpdateTrackingLogModalController', UpdateTrackingLogModalController);

UpdateTrackingLogModalController.$inject = [
  '$state', 'params', 'ShipmentService', 'NotifyService',
  'bhConstants', '$uibModalInstance',
];

/**
 *
 * @param $state
 * @param params
 * @param Shipments
 * @param Notify
 * @param Constants
 * @param Instance
 */
function UpdateTrackingLogModalController($state, params, Shipments, Notify, Constants, Instance) {
  const vm = this;
  const identifier = params.uuid;

  vm.submit = submit;
  vm.cancel = Instance.dismiss;

  load();

  /**
   *
   */
  function load() {
    if (identifier) {
      Shipments.read(identifier)
        .then(shipment => {
          vm.shipment = shipment;
          return Shipments.overview(identifier);
        })
        .then(result => {
          vm.locations = result.locations;
        })
        .catch(Notify.handleError);
    }
  }

  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) { return null; }

    return Shipments.addShipmentTrackingLotEntry(identifier, vm.shipment)
      .then(() => {
        Notify.success('SHIPMENT.UPDATED');
        Instance.dismiss(true);
        $state.go('shipments', null, { reload : true });
      })
      .catch(Notify.handleError);
  }
}
