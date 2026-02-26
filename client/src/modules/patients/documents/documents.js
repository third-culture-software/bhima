angular.module('bhima.controllers')
  .controller('PatientDocumentsController', PatientDocumentsController);

PatientDocumentsController.$inject = [
  '$state', 'PatientService', 'NotifyService',
];

/**
 *
 * @param $state
 * @param Patients
 * @param Notify
 */
function PatientDocumentsController($state, Patients, Notify) {
  const vm = this;

  /** global objects */
  vm.patientUuid = $state.params.patient_uuid;

  /** getting patient details */
  Patients.read(vm.patientUuid)
    .then((patient) => {
      vm.formatedPatientName = patient.first_name.concat(
        ' ', patient.middle_name,
        ' ', patient.last_name,
      );
    })
    .catch(Notify.handleError);

}
