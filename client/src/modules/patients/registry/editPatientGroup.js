angular.module('bhima.controllers')
  .controller('EditPatientGroupModalController', EditPatientGroupModalController);

EditPatientGroupModalController.$inject = [
  'data', '$uibModalInstance', 'NotifyService',
  'PatientGroupService', 'PatientService',
];

/**
 * @param data
 * @param Instance
 * @param Notify
 * @param PatientGroups
 * @param Patients
 * @class EditPatientGroupModalController
 * @description
 * This controller provides the functionality to change patient groups
 * in bulk.  Multiple patients are provided in the 'data' parameter, and
 * they are able to be put into the desired patient groups by selecting
 * checkboxes.
 */
function EditPatientGroupModalController(data, Instance, Notify, PatientGroups, Patients) {
  const vm = this;
  vm.cancel = () => Instance.close();
  vm.submit = submit;
  vm.subscribedGroups = {};

  vm.onToggleCheckboxes = onToggleCheckboxes;
  vm.onToggleRemoveAll = onToggleRemoveAll;

  PatientGroups.read()
    .then(sessionGroups => {
      vm.patientGroups = sessionGroups;
      sessionGroups.forEach((patientGroup) => {
        vm.subscribedGroups[patientGroup.uuid] = false;
      });
    })
    .catch(Notify.handleError);

  /**
   *
   */
  function getGroups() {
    const subscribedGroups = [];
    const keys = Object.keys(vm.subscribedGroups);

    keys.forEach(groupUuid => {
      if (vm.subscribedGroups[groupUuid]) {
        subscribedGroups.push(groupUuid);
      }
    });

    return subscribedGroups;
  }

  // fires when any of the patient group checkboxes are toggled
  /**
   *
   */
  function onToggleCheckboxes() {
    if (vm.removeAssignedGroups) {
      vm.removeAssignedGroups = 0;
    }
  }

  // fires when the "remove all" checkbox is toggled
  /**
   *
   */
  function onToggleRemoveAll() {
    vm.subscribedGroups = {};
  }

  /**
   *
   */
  function submit() {
    if (vm.patient_group_uuid) {
      Notify.danger('FORM.ERRORS.HAS_ERRORS');
      return null;
    }

    const subscribedGroups = getGroups();
    if (subscribedGroups.length === 0 && !vm.removeAssignedGroups) {
      return null;
    }

    const options = {
      subscribedGroups,
      patientUuids : data,
      removeAssignedGroups : vm.removeAssignedGroups,
    };

    return Patients.bulkUpdateGroups(options)
      .then(() => Instance.close(true))
      .catch(Notify.handleError);
  }
}
