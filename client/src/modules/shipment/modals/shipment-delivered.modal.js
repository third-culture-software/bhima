angular.module('bhima.controllers')
  .controller('ShipmentDeliveredModalController', ShipmentDeliveredModalController);

ShipmentDeliveredModalController.$inject = [
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
function ShipmentDeliveredModalController($state, params, Shipments, Notify, Constants, Instance) {
  const vm = this;
  const identifier = params.uuid;

  vm.submit = submit;
  vm.cancel = () => Instance.dismiss(false);

  load();

  /**
   *
   */
  function load() {
    if (identifier) {
      Shipments.read(identifier)
        .then(shipment => {
          vm.shipment = shipment;
          vm.isInTransit = !!(shipment.status_id === Constants.shipmentStatus.IN_TRANSIT);
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

    return Shipments.setShipmentDelivered(identifier)
      .then(() => {
        Notify.success('SHIPMENT.UPDATED');
        Instance.dismiss(true);
        $state.go('shipments', null, { reload : true });
      })
      .catch(Notify.handleError);
  }
}
