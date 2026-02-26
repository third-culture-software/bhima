angular.module('bhima.components')
  .component('bhDebtorGroupHistory', {
    templateUrl : 'modules/templates/bhDebtorGroupHistory.tmpl.html',
    controller : bhDebtorGroupHistoryController,
    transclude : true,
    bindings : {
      debtorUuid : '<',
      refresh : '<?', // set to true to refresh history
      limit : '@?',
    },
  });

bhDebtorGroupHistoryController.$inject = ['DebtorGroupService', 'NotifyService'];
/**
 * Debtor Group History Component
 * @param DebtorGroup
 * @param Notify
 */
function bhDebtorGroupHistoryController(DebtorGroup, Notify) {
  const $ctrl = this;

  // fired at the beginning
  $ctrl.$onInit = () => {
    $ctrl.limit = $ctrl.limit || 5;
    loadHistory();
  };

  $ctrl.$onChanges = (changes) => {
    if (changes.debtorUuid || changes.refresh.currentValue) {
      loadHistory();
    }
  };

  /**
   *
   */
  function loadHistory() {
    const parameters = { limit : $ctrl.limit };
    $ctrl.loading = true;
    DebtorGroup.history($ctrl.debtorUuid, parameters)
      .then(groupChanges => {
        $ctrl.groupChanges = groupChanges;
      })
      .catch(Notify.handleError)
      .finally(() => {
        $ctrl.loading = false;
      });
  }
}
