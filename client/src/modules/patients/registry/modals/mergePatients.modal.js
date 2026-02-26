angular.module('bhima.controllers')
  .controller('MergePatientsModalController', MergePatientsModalController);

MergePatientsModalController.$inject = [
  'PatientService', '$state', 'NotifyService', '$uibModalInstance', 'params',
];

/**
 *
 * @param Patients
 * @param $state
 * @param Notify
 * @param Instance
 * @param parameters
 */
function MergePatientsModalController(Patients, $state, Notify, Instance, parameters) {
  const vm = this;

  vm.patients = parameters.patients;
  vm.submit = submit;

  vm.selectPatient = uuid => {
    vm.selected = uuid;
  };

  /**
   *
   */
  function init() {
    const params = vm.patients.map(p => p.uuid);
    Patients.countEmployees(params)
      .then(data => {
        vm.allAreEmployees = data.total_employees === params.length;
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function submit() {
    if (vm.allAreEmployees) { return null; }

    // Quick fix prevent fatal error : 2020-07-07 By: lomamech
    if (!vm.selected) {
      return Notify.danger('FORM.WARNINGS.EMPTY_SELECTION');
    }

    const params = {
      selected : vm.selected,
      other : vm.patients.filter(p => p.uuid !== vm.selected).map(p => p.uuid),
    };

    return Patients.merge(params)
      .then(() => {
        Notify.success('PATIENT_REGISTRY.MERGE_SUCCESS');
        Instance.close();
        $state.go('patientRegistry', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  init();
}
