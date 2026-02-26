angular.module('bhima.components')
  .component('bhPatientGroupSelect', {
    templateUrl : 'modules/templates/bhPatientGroupSelect.tmpl.html',
    controller  : PatientGroupSelectController,
    transclude  : true,
    bindings    : {
      patientGroupUuid : '<',
      onSelectCallback : '&',
      label            : '@?',
      required         : '<?',
    },
  });

PatientGroupSelectController.$inject = [
  'PatientGroupService', 'NotifyService',
];

/**
 * Patient Group Selection Component
 * @param PatientGroups
 * @param Notify
 */
function PatientGroupSelectController(PatientGroups, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    // default for label
    $ctrl.label = $ctrl.label || 'PATIENT_GROUP.PATIENT_GROUP';

    // load all patient groups
    PatientGroups.read()
      .then(patientGroups => {
        $ctrl.patientGroups = patientGroups;
      })
      .catch(Notify.handleError);
  };

  $ctrl.onSelect = patientGroup => {
    $ctrl.onSelectCallback({ patientGroup });
  };
}
