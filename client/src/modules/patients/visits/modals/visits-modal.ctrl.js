angular.module('bhima.controllers')
  .controller('VisitsAdmissionController', VisitsAdmissionController);

VisitsAdmissionController.$inject = [
  '$uibModalInstance', 'PatientService', 'VisitService', 'NotifyService',
  'patient', 'isAdmission', 'currentVisit',
];

function VisitsAdmissionController(ModalInstance, Patients, Visits, Notify,
  patient, isAdmission, currentVisit) {
  const vm = this;

  vm.isAdmission = isAdmission;
  vm.currentVisit = currentVisit;
  vm.patientUuid = patient;
  vm.hasPatient = !!patient;

  // TODO(@jniles) - move this into a user-configurable setting
  vm.REQUIRED_DIAGNOSES = false;

  // expose action methods
  vm.cancel = ModalInstance.close;
  vm.admit = admit;

  vm.visit = {
    hospitalized : 0,
    inside_health_zone : 1,
    is_new_case : 1,
  };

  vm.onBedRoomSelect = bed => {
    vm.visit.bed = bed;
  };

  vm.onChangeRefered = value => {
    vm.visit.is_refered = value;
  };

  vm.onChangePregnant = value => {
    vm.visit.is_pregnant = value;
  };

  vm.onServiceSelect = service => {
    vm.visit.service = service;
  };

  vm.onSelectPatient = p => {
    vm.isFemale = p.sex === 'F';

    Visits.admissionStatus(p.uuid)
      .then(result => {
        if (!result.is_admitted) {
          // eslint-disable-next-line no-param-reassign
          patient = p.uuid;
          vm.alreadyAdmitted = 0;
        } else {
          vm.alreadyAdmitted = 1;
        }
      })
      .catch(Notify.handleError);
  };

  vm.onSelectDischarge = discharge => {
    vm.visit.discharge_type_id = discharge;
  };

  vm.onSelectDiagnosis = diagnosis => {
    if (vm.isAdmission) {
      vm.visit.start_diagnosis_id = diagnosis.id;
    } else {
      vm.visit.end_diagnosis_id = diagnosis.id;
    }
  };

  // assign current visit uuid to discharge values
  if (!vm.isAdmission && currentVisit) {
    vm.visit.uuid = currentVisit.uuid;
  }

  if (vm.isAdmission && patient) {
    Patients.read(patient)
      .then(patientDetails => {
        vm.isFemale = patientDetails.sex === 'F';
      })
      .catch(Notify.handleError);
  }

  function admit(form) {
    if (vm.alreadyAdmitted) {
      Notify.danger('FORM.INFO.PATIENT_VISIT_PENDING');
      return null;
    }

    if (form.$invalid || !patient) { return null; }

    // the columns updated on the patient visit table will depend on the admission/ discharge type
    const submitMethod = vm.isAdmission ? Patients.Visits.admit : Patients.Visits.discharge;

    return submitMethod(patient, vm.visit)
      .then(() => {
        const notifyMessage = vm.isAdmission
          ? 'FORM.INFO.VISIT_RECORDED_SUCCESSFULLY' : 'FORM.INFO.DISCHARGE_RECORDED_SUCCESSFULLY';
        Notify.success(notifyMessage);
        ModalInstance.close(true);
      });
  }
}
