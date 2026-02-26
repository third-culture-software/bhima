angular.module('bhima.controllers')
  .controller('BreakDownModalController', BreakDownModalController);

BreakDownModalController.$inject = [
  '$state', 'NotifyService', 'DistributionCenterService', 'SessionService', 'data', '$uibModalInstance',
  'CostCenterService', '$translate', 'util',
];

/**
 *
 * @param $state
 * @param Notify
 * @param DistributionCenter
 * @param Session
 * @param data
 * @param ModalInstance
 * @param CostCenters
 * @param $translate
 * @param util
 */
function BreakDownModalController(
  $state, Notify, DistributionCenter, Session, data, ModalInstance, CostCenters, $translate, util,
) {
  const vm = this;
  vm.transaction = data.transactions;

  [vm.costCenter] = vm.transaction;

  vm.cancel = cancel;
  vm.enterprise = Session.enterprise;

  let sumDebits = 0;
  let sumCredits = 0;

  vm.transaction.forEach(item => {
    sumDebits += item.debit_equiv;
    sumCredits += item.credit_equiv;
  });

  vm.sumDebits = sumDebits;
  vm.sumCredits = sumCredits;

  // exposed methods
  vm.submit = submit;

  CostCenters.read()
    .then((costCenter) => {
      vm.principalCostCenters = costCenter.filter(item => {
        return item.is_principal;
      });

      if (!vm.principalCostCenters.length) {
        vm.noPrincilCostCenters = true;
      }
    })
    .catch(Notify.handleError);

  /**
   *
   * @param DistributionForm
   */
  function submit(DistributionForm) {
    let sumDistributed = 0;

    Object.keys(vm.percentage.values).forEach((key) => {
      sumDistributed += vm.percentage.values[key];
    });

    // sumDistributed sum must always be 100 for 100%
    sumDistributed = util.roundDecimal(sumDistributed, 0);

    vm.invalidBreakDown = sumDistributed !== 100;
    vm.diffPercentage = Math.abs((sumDistributed - 100));

    vm.errorMessage = (sumDistributed < 100)
      ? $translate.instant('FORM.WARNINGS.REMAINS_DISTRIBUTION', { value : `${vm.diffPercentage} %` })
      : $translate.instant('FORM.WARNINGS.OVERRUN_DISTRIBUTION', { value : `${vm.diffPercentage} %` });

    if (DistributionForm.$invalid || vm.invalidBreakDown) {
      return Notify.danger('FORM.ERRORS.INVALID');
    }

    vm.percentage.transactions = vm.transaction;
    vm.percentage.cost_center_id = vm.costCenter.cost_center_id;
    vm.percentage.is_cost = data.isCost;

    return DistributionCenter.proceedBreakDownPercent(vm.percentage)
      .then(() => {
        Notify.success('FORM.INFO.DISTRIBUTION_SUCCESSFULLY');
        cancel();
        $state.go('allocation_center', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function cancel() {
    ModalInstance.close();
  }
}
