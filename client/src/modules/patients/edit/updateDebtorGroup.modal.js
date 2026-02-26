angular.module('bhima.controllers')
  .controller('UpdateDebtorGroup', UpdateDebtorGroup);

UpdateDebtorGroup.$inject = [
  '$uibModalInstance', 'DebtorService', 'patient', 'updateModel',
];

/**
 *
 * @param $uibModalInstance
 * @param debtors
 * @param patient
 * @param updateModel
 */
function UpdateDebtorGroup($uibModalInstance, debtors, patient, updateModel) {
  const viewModel = this;
  let originalGroupUuid;

  viewModel.patient = patient;

  // Set up page elements data (debtor select data)
  viewModel.onSelectDebtor = onSelectDebtor;

  /**
   *
   * @param debtorGroup
   */
  function onSelectDebtor(debtorGroup) {
    originalGroupUuid = viewModel.patient.debtor_group_uuid;
    viewModel.debtor_group_uuid = debtorGroup.uuid;
    viewModel.debtorGroup = debtorGroup;
  }

  // form submission
  viewModel.confirmGroup = function confirmGroup() {
    const noGroupChange = (originalGroupUuid === viewModel.debtor_group_uuid);

    // if there was no change in the groups, just close the modal.
    if (noGroupChange) {
      closeModal();
      return 0;
    }

    const updateRequest = {
      group_uuid : viewModel.debtor_group_uuid,
    };

    return debtors.update(patient.debtor_uuid, updateRequest)
      .then(() => {
        updateModel(viewModel.debtor_group_uuid, viewModel.debtorGroup.name);
        closeModal();
      });
  };

  viewModel.closeModal = closeModal;

  /**
   *
   */
  function closeModal() {
    $uibModalInstance.close();
  }
}
