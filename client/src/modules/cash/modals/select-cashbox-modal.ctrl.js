angular.module('bhima.controllers')
  .controller('SelectCashboxModalController', SelectCashboxModalController);

SelectCashboxModalController.$inject = [
  'SessionService', '$uibModalInstance', 'CashboxService', '$stateParams',
  'NotifyService',
];

/**
 * This modal selects the active cashbox on the cash page
 */
function SelectCashboxModalController(Session, Instance, Cashboxes, $stateParams, Notify) {
  const vm = this;

  const cashboxId = $stateParams.id;
  vm.cashboxId = cashboxId;
  vm.selectCashbox = selectCashbox;
  vm.hasCashboxes = false;
  /* ------------------------------------------------------------------------ */

  // loads a new set of cashboxes from the server that the user has management right.
  function startup() {
    toggleLoadingIndicator();
    Cashboxes.readPrivileges()
      .then((cashboxes) => {
        vm.cashboxes = cashboxes;
        vm.hasCashboxes = cashboxes.length > 0;
        vm.currentProjectCashboxes = cashboxes.filter((cashbox) => {
          return ((cashbox.project_id === Session.project.id) && cashbox.user_id);
        });

        vm.otherProjectCashboxes = cashboxes.filter((cashbox) => {
          return ((cashbox.project_id !== Session.project.id) && cashbox.user_id);
        });

        // convenience variables to clean up view logic
        vm.hasCurrentProjectCashboxes = vm.currentProjectCashboxes.length > 0;
        vm.hasOtherProjectCashboxes = vm.otherProjectCashboxes.length > 0;

        if (cashboxId) {
          selectCashbox(cashboxId);
        }

        /**
        * This section makes it possible to check if the user does not have
        * permissions to a cash register or that it does not exist
        */
        vm.currentCashboxes = cashboxes
          .filter(cashbox => cashbox.project_id === Session.project.id);

        vm.otherCashboxes = cashboxes
          .filter(cashbox => cashbox.project_id !== Session.project.id);

        vm.hasCurrentCashboxes = vm.currentCashboxes.length > 0;
        vm.hasOtherCashboxes = vm.otherCashboxes.length > 0;

      })
      .catch(Notify.handleError)
      .finally(toggleLoadingIndicator);
  }

  // fired when a user selects a cashbox from a list
  function selectCashbox(id) {
    let selected;

    vm.cashboxes.forEach((box) => {
      if (box.id === id) {
        selected = box;
      }
    });

    vm.selectedCashbox = selected;
  }

  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  // start up the module
  startup();
}
