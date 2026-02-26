angular.module('bhima.components')
  .component('bhDiagnosisSelect', {
    templateUrl : 'js/components/bhDiagnosisSelect/bhDiagnosisSelect.html',
    controller  : DiagnosisSelectController,
    transclude  : true,
    bindings    : {
      onSelectCallback : '&',
      required : '<?',
    },
  });

DiagnosisSelectController.$inject = ['PatientService', 'NotifyService'];

/**
 * Diagnosis selection component
 * @param Patients
 * @param Notify
 */
function DiagnosisSelectController(Patients, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {

    // TODO(@jniles) - load these asynchronously using a MySQL %LIKE% for perf
    Patients.Visits.diagnoses()
      .then(results => {
        $ctrl.diagnoses = results;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = $item => {
    $ctrl.onSelectCallback({ diagnosis : $item });
  };
}
