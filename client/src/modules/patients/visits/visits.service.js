angular.module('bhima.services')
  .service('VisitService', VisitService);

VisitService.$inject = [
  '$http', 'util', '$uibModal', 'GridRegistryFilterer',
];

function VisitService(
  $http, util, $uibModal, GridRegistryFilterer,
) {
  const service = this;
  const baseUrl = '/patients';
  const grid = new GridRegistryFilterer('PatientAdmissionRegistryFilterer');

  // expose the grid registry filterers
  service.grid = grid;

  // send/receive with $http
  service.read = read;
  service.admit = admit;
  service.discharge = discharge;
  service.diagnoses = diagnoses;
  service.transfer = transfer;
  service.admissionStatus = admissionStatus;

  // methods for admissions
  service.admissions = {};
  service.admissions.read = admissionRead;

  // open modal configuration
  service.openAdmission = openAdmission;
  service.openAdmissionSearchModal = openAdmissionSearchModal;
  service.openTransferModal = openTransferModal;

  function read(patientUuid, options) {
    if (!patientUuid) { return 0; }

    return $http.get(`${baseUrl}/${patientUuid}/visits`, { params : options })
      .then(util.unwrapHttpResponse);
  }

  function admissionStatus(patientUuid) {
    return $http.get(`${baseUrl}/${patientUuid}/visits/status`)
      .then(util.unwrapHttpResponse);
  }

  function admit(patientUuid, visitDetails) {
    if (!patientUuid) { return 0; }

    // format admission specific information
    const details = angular.copy(visitDetails);

    if (details.notes) {
      details.start_notes = details.notes;
      delete details.notes;
    }

    if (details.diagnosis) {
      details.start_diagnosis_id = details.diagnosis.id;
    }

    delete details.diagnosis;

    return $http.post(`${baseUrl}/${patientUuid}/visits/admission`, details)
      .then(util.unwrapHttpResponse);
  }

  function discharge(patientUuid, visitDetails) {
    if (!patientUuid) { return 0; }

    // format admission specific information
    const details = angular.copy(visitDetails);

    if (details.notes) {
      details.end_notes = details.notes;
      delete details.notes;
    }

    if (details.diagnosis) {
      details.end_diagnosis_id = details.diagnosis.id;
    }

    delete details.diagnosis;
    delete details.hospitalized;

    return $http.post(`${baseUrl}/${patientUuid}/visits/discharge`, details)
      .then(util.unwrapHttpResponse);
  }

  function transfer(patientUuid, visitUuid, bedDetails) {
    // format admission specific information
    const details = angular.copy(bedDetails);

    return $http.post(`${baseUrl}/${patientUuid}/visits/${visitUuid}/transfer`, details)
      .then(util.unwrapHttpResponse);
  }

  function diagnoses() {
    return $http.get('/diagnoses')
      .then(util.unwrapHttpResponse);
  }

  // admission vs. discharge
  function openAdmission(patientUuid, isAdmission, currentVisit) {
    const modalOptions = {
      templateUrl : 'modules/patients/visits/modals/visits.modal.html',
      controller : 'VisitsAdmissionController',
      controllerAs : 'AdmitCtrl',
      keyboard : false,
      size : 'md',
      resolve : {
        patient : () => patientUuid,
        isAdmission : () => isAdmission,
        currentVisit : () => currentVisit,
      },
    };

    const instance = $uibModal.open(modalOptions);
    return instance.result;
  }

  function admissionRead(uuid, options) {
    if (uuid) {
      return $http.get(`${baseUrl}/visits/${uuid}`, { params : options })
        .then(util.unwrapHttpResponse);
    }

    return $http.get(`${baseUrl}/visits`, { params : options })
      .then(util.unwrapHttpResponse);
  }

  /**
   * @method openSearchModal
   *
   * @param {Object} params - an object of filter parameters to be passed to
   *   the modal.
   * @returns {Promise} modalInstance
   */
  function openAdmissionSearchModal(params) {
    return $uibModal.open({
      templateUrl : 'modules/patients/visits/modals/search.modal.html',
      size : 'md',
      keyboard : false,
      animation : false,
      backdrop : 'static',
      controller : 'AdmissionRegistryModalController as $ctrl',
      resolve : { filters : () => params },
    }).result;
  }

  /**
   * @method openTransferModal
   */
  function openTransferModal(params) {
    return $uibModal.open({
      templateUrl : 'modules/patients/visits/modals/transfer.modal.html',
      size : 'md',
      keyboard : false,
      animation : false,
      backdrop : 'static',
      controller : 'PatientTransferModalController as $ctrl',
      resolve : { params : () => params },
    }).result;
  }

}
