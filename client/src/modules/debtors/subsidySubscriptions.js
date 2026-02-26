angular.module('bhima.controllers')
  .controller('SubsidySubscriptions', SubsidySubscriptions);

SubsidySubscriptions.$inject = [
  '$uibModalInstance', 'DebtorGroup', 'SubsidyService', 'DebtorGroupService',
  'NotifyService',
];

/**
 *
 * @param ModalInstance
 * @param DebtorGroup
 * @param Subsidies
 * @param DebtorGroups
 * @param Notify
 */
function SubsidySubscriptions(ModalInstance, DebtorGroup, Subsidies, DebtorGroups, Notify) {
  const vm = this;

  vm.close = ModalInstance.dismiss;
  vm.confirmSubscription = confirmSubscription;

  vm.group = DebtorGroup;

  vm.entityKey = 'DEBTOR_GROUP.POLICIES.SUBSIDIES.TITLE';
  vm.subscriptions = {};
  vm.subsidies = [];

  initialiseSubscriptions();

  Subsidies.read()
    .then((result) => {
      vm.subsidies = result;

      // mirror for generic view
      vm.entities = vm.subsidies;
    });

  /**
   *
   * @param subscriptionForm
   */
  function confirmSubscription(subscriptionForm) {

    if (subscriptionForm.$pristine) {
      ModalInstance.dismiss();
      return;
    }

    DebtorGroups.updateSubsidies(vm.group.uuid, vm.subscriptions)
      .then(() => {
        ModalInstance.close(formatSelection());
      })
      .catch(Notify.handleError);
  }

  /**
   * @function formatSelection
   * @description
   * This function formats the newly selected/ subscribed subsidies to
   * update the parent states view.
   */
  function formatSelection() {
    return vm.subsidies
      .filter(subsidy => vm.subscriptions[subsidy.id])
      .map(subsidy => {
        // transform id to subsidy specifically; routes could be updated to use id
        subsidy.subsidy_id = subsidy.id;
        return subsidy;
      });
  }

  /**
   * @function initialiseSubscriptions
   * @description
   * Iterate through debtor group subsidies and pre-populate
   * the binary flags for current subscriptions
   */
  function initialiseSubscriptions() {
    vm.group.subsidies.forEach((subsidy) => {
      vm.subscriptions[subsidy.subsidy_id] = true;
    });
  }
}
