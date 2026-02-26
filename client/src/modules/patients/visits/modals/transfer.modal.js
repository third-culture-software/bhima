angular.module('bhima.controllers')
  .controller('PatientTransferModalController', PatientTransferModalController);

PatientTransferModalController.$inject = [
  'VisitService', '$uibModalInstance', 'NotifyService', 'params',
];

/**
 *
 * @param Visits
 * @param Modal
 * @param Notify
 * @param Params
 */
function PatientTransferModalController(Visits, Modal, Notify, Params) {
  const vm = this;

  vm.details = {
    display_name : Params.patient_display_name,
    location : Params.location,
  };

  // expose action methods
  vm.cancel = Modal.close;

  vm.onBedRoomSelect = bed => {
    vm.bed = bed;
  };

  vm.transfer = () => {
    if (!vm.bed) { return null; }

    return Visits.transfer(Params.patient_uuid, Params.patient_visit_uuid, vm.bed)
      .then(transfered => {
        if (!transfered) { return; }

        Notify.success('PATIENT_RECORDS.TRANSFER.SUCCESSFULLY_TRANSFERED');
        Modal.close(true);
      });
  };
}
