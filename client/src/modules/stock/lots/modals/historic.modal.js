angular.module('bhima.controllers')
  .controller('HistoricModalController', HistoricModalController);

// dependencies injections
HistoricModalController.$inject = [
  'LotService', '$uibModalInstance', 'NotifyService', 'data',
];

/**
 *
 * @param Lots
 * @param Instance
 * @param Notify
 * @param Data
 */
function HistoricModalController(Lots, Instance, Notify, Data) {
  const vm = this;
  vm.model = {};
  vm.cancel = Instance.dismiss;

  /**
   *
   */
  function startup() {
    // lot details
    Lots.read(Data.uuid)
      .then(lot => {
        vm.lot = lot;
      })
      .catch(Notify.handleError);

    // assignments details
    Lots.assignments(Data.uuid, Data.depotUuid)
      .then(assignments => {
        vm.lotAssignments = assignments;

        // If the last one is not assigned, add a fake extra line to make that clear
        const last = vm.lotAssignments[vm.lotAssignments.length - 1];
        if (last && !last.is_active) {
          vm.lotAssignments.push({
            created_at : last.updated_at,
            entity_name : null,
            is_active : 0,
          });
        }
      })
      .catch(Notify.handleError);
  }

  startup();
}
