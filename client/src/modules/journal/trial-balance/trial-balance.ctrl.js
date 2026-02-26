angular.module('bhima.controllers')
  .controller('TrialBalanceController', TrialBalanceController);

TrialBalanceController.$inject = ['TrialBalanceService', '$state', 'NotifyService'];

/**
 * @param TrialBalance
 * @param $state
 * @param Notify
 * @class TrialBalanceController
 * @description
 * This applies to the structure.html file
 */
function TrialBalanceController(TrialBalance, $state, Notify) {
  const vm = this;

  /**
   *
   */
  function startup() {
    vm.isLoading = true;

    TrialBalance.errors()
      .then((errors) => {
        const hasErrors = Boolean(errors.length);

        vm.numErrors = errors.length;
        vm.showErrorMessage = hasErrors;
        vm.showSuccessMessage = !hasErrors;
      })
      .finally(() => {
        vm.isLoading = false;
      });
  }

  // attach the grid exporter as needed
  vm.export = function exporter() {
    TrialBalance.exportGrid();
  };

  vm.submit = function submit() {
    // compute the number of transactions
    const numTransactions = TrialBalance.transactions().length;

    vm.isLoading = true;
    return TrialBalance.postToGeneralLedger()
      .then(() => {
        Notify.success('JOURNAL.TRIAL_BALANCE.POSTED_TRANSACTIONS', { numRecords : numTransactions });
        vm.isLoading = true;
        $state.go('journal', null, { reload : true });
      })
      .catch(Notify.handleError);
  };

  startup();
}
