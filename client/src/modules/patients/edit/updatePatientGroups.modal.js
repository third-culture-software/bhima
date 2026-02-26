angular.module('bhima.controllers')
  .controller('UpdatePatientGroups', UpdatePatientGroups);

UpdatePatientGroups.$inject = [
  '$uibModalInstance', 'PatientService', 'sessionPatient', 'sessionGroups',
  'updateModel', 'NotifyService',
];

/**
 *
 * @param $uibModalInstance
 * @param patients
 * @param sessionPatient
 * @param sessionGroups
 * @param updateModel
 * @param Notify
 */
function UpdatePatientGroups($uibModalInstance, patients, sessionPatient, sessionGroups, updateModel, Notify) {
  const vm = this;

  // TODO move to method
  vm.subscribedGroups = {};
  vm.patient = sessionPatient;

  sessionGroups.forEach((patientGroup) => {
    vm.subscribedGroups[patientGroup.uuid] = true;
  });

  // TODO Handle errors with generic modal exception display (inform system administrator)
  patients.groups()
    .then((groups) => {
      vm.patientGroups = groups;
    })
    .catch(Notify.handleError);

  vm.confirmGroups = function confirmGroup(groupForm) {

    // if untouched, exit the modal
    if (groupForm.$pristine) {
      closeModal();
      return 0;
    }

    return patients.updateGroups(sessionPatient.uuid, vm.subscribedGroups)
      .then(() => {

        // TODO move to method
        const formatControllerResponse = [];

        // Fetch each of the updated group definitions and collect them in an array
        Object.keys(vm.subscribedGroups).forEach((groupKey) => {
          if (vm.subscribedGroups[groupKey]) {
            formatControllerResponse.push(fetchGroupObject(groupKey));
          }
        });

        updateModel(formatControllerResponse);
        closeModal();
      });
  };

  // TODO Refactor - use stores?
  /**
   *
   * @param uuid
   */
  function fetchGroupObject(uuid) {
    const groups = vm.patientGroups;
    let i = groups.length;
    let groupObject;

    while (i--) {
      if (groups[i].uuid === uuid) {
        groupObject = groups[i];
        break;
      }
    }

    return groupObject;
  }

  vm.closeModal = closeModal;

  /**
   *
   */
  function closeModal() {
    $uibModalInstance.dismiss();
  }
}
