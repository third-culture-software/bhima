angular.module('bhima.controllers')
  .controller('BreakDownModalController', BreakDownModalController);

BreakDownModalController.$inject = [
  '$state', 'NotifyService', 'DistributionCenterService', 'SessionService', 'data', '$uibInstance',
  'CostCenterService', '$translate', 'util',
];

/**
 * @param $state
 * @param Notify
 * @param DistributionCenter
 * @param Session
 * @param data
 * @param Instance
 * @param CostCenters
 * @param $translate
 * @param util
 */
function BreakDownModalController(
  $state, Notify, DistributionCenter, Session, data, Instance, CostCenters, $translate, util,
) {
  const vm = this;
  vm.transaction = data.transactions;
  vm.enterprise = Session.enterprise;

  [vm.costCenter] = vm.transaction;

  vm.cancel = () => Instance.close();

  vm.onChangePercentageValue = (value, costCenterId) => {
    vm.percentage.values[costCenterId] = value;
  };

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
      vm.principalCostCenters = costCenter.filter(i => i.is_principal);

      if (!vm.principalCostCenters.length) {
        vm.noPrincipalCostCenters = true;
      }
    })
    .catch(Notify.handleError);

  /**
   *
   * @param DistributionForm
   */
  function submit(DistributionForm) {

    let sumDistributed = Object.keys(vm.percentage.values)
      .reduce((agg, key) => agg + vm.percentage.values[key], 0);

    // sumDistributed sum must always be 100 for 100%
    sumDistributed = util.roundDecimal(sumDistributed, 0);

    vm.invalidBreakDown = sumDistributed !== 100;

    vm.diffPercentage = Math.abs((sumDistributed - 100));

    const msg = sumDistributed < 100 ? 'FORM.WARNINGS.REMAINS_DISTRIBUTION' : 'FORM.WARNINGS.OVERRUN_DISTRIBUTION';
    vm.errorMessage = $translate.instant(msg, { value : `${vm.diffPercentage} %` })

    if (DistributionForm.$invalid || vm.invalidBreakDown) {
      return Notify.danger('FORM.ERRORS.INVALID');
    }

    vm.percentage.transactions = vm.transaction;
    vm.percentage.cost_center_id = vm.costCenter.cost_center_id;
    vm.percentage.is_cost = data.isCost;

    return DistributionCenter.proceedBreakDownPercent(vm.percentage)
      .then(() => {
        Notify.success('FORM.INFO.DISTRIBUTION_SUCCESSFULLY');
        Instance.close();
        $state.go('allocation_center', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

}
