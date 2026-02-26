angular.module('bhima.services')
  .service('PatientGroupModal', PatientGroupModal);

PatientGroupModal.$inject = ['$uibModal'];

/**
 * This service is responsible for configuring and exposing modal that can be
 * used to configure a patients groups subscription.
 * @param Modal
 * @todo remove callbacks in favour of propegating values through promise fufillment
 */
function PatientGroupModal(Modal) {
  const service = this;

  const modalConfig = {
    animation : true,
    size : 'md',
    keyboard : false,
    backdrop : 'static',
  };

  service.updateDebtor = updateDebtor;
  service.updateGroupConfig = updateGroupConfig;

  /**
   * This function if responsible for configuring and openening a modal to update
   * debtor groups given a patient and a complete callback
   * @param Object     patientEntity
   * @param patientEntity
   * @param callback
   */
  function updateDebtor(patientEntity, callback) {
    const debtorGroupConfig = {
      templateUrl : 'modules/patients/edit/updateDebtorGroup.tmpl.html',
      controller : 'UpdateDebtorGroup as UpdateDebtorGroupCtrl',
      resolve : {
        patient() {
          return patientEntity;
        },

        /** @todo investigate passing multiple params through $modal.close to remove callback methods */
        updateModel() {
          return callback;
        },
      },
    };

    angular.extend(debtorGroupConfig, modalConfig);

    const modalInstance = Modal.open(debtorGroupConfig);
    return modalInstance.result;
  }

  /**
   *
   * @param patientEntity
   * @param groups
   * @param callback
   */
  function updateGroupConfig(patientEntity, groups, callback) {
    const patientGroupConfig = {
      templateUrl : 'modules/patients/edit/updatePatientGroups.tmpl.html',
      controller : 'UpdatePatientGroups as UpdatePatientGroupsCtrl',
      resolve : {
        sessionPatient() {
          return patientEntity;
        },
        sessionGroups() {
          return groups;
        },

        /** @todo investigate passing multiple params through $modal.close to remove callback methods */
        updateModel() {
          return callback;
        },
      },
    };

    angular.extend(patientGroupConfig, modalConfig);

    const modalInstance = Modal.open(patientGroupConfig);
    return modalInstance.result;
  }
}
