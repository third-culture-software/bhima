angular.module('bhima.controllers')
  .controller('DistributionModalController', DistributionModalController);

DistributionModalController.$inject = [
  '$state', 'NotifyService', 'DistributionCenterService',
  'SessionService', 'transaction', '$uibModalInstance', 'CostCenterService', 'util', '$translate',
];

function DistributionModalController(
  $state, Notify, DistributionCenter, Session, transaction, ModalInstance, CostCenters, util, $translate,
) {
  const vm = this;
  vm.transaction = transaction;
  vm.cancel = cancel;
  vm.enterprise = Session.enterprise;

  if (vm.transaction.updating) {
    let sumDebits = 0;
    let sumCredits = 0;
    vm.transaction.values = {};
    vm.transaction.amount_equiv = vm.transaction.debit_equiv || vm.transaction.credit_equiv;

    vm.transaction.distributionValues.forEach(item => {
      sumDebits += item.debit_equiv;
      sumCredits += item.credit_equiv;
    });

    vm.transaction.amount_equiv = sumDebits || sumCredits;
  }

  const path = vm.transaction.updating ? 'update_allocation_center' : 'allocation_center';

  // exposed methods
  vm.submit = submit;
  vm.latestViewFilters = DistributionCenter.filters.formatView();

  CostCenters.read()
    .then((costCenter) => {
      vm.principalCostCenters = costCenter.filter(item => {
        return item.is_principal;
      });

      if (vm.transaction.updating && vm.principalCostCenters.length) {
        vm.principalCostCenters.forEach(item => {

          vm.transaction.distributionValues.forEach(values => {
            if (item.id === values.id) {
              vm.transaction.values[item.id] = values.debit_equiv || values.credit_equiv;
            }
          });
        });
      }

      if (!vm.principalCostCenters.length) {
        vm.noPrincilCostCenters = true;
      }
    })
    .catch(Notify.handleError);

  function submit(DistributionForm) {
    let sumDistributed = 0;

    Object.keys(vm.transaction.values).forEach((key) => {
      sumDistributed += vm.transaction.values[key];
    });

    sumDistributed = util.roundDecimal(sumDistributed, 2);
    const amountEquiv = util.roundDecimal(vm.transaction.amount_equiv, 2);
    const diffAmount = util.roundDecimal((amountEquiv - sumDistributed), 2);

    vm.invalidDistribution = sumDistributed !== amountEquiv;
    vm.diffAmount = Math.abs(diffAmount);

    vm.errorMessage = (vm.transaction.amount_equiv > sumDistributed)
      ? $translate.instant('FORM.WARNINGS.REMAINS_DISTRIBUTION', { value : vm.diffAmount })
      : $translate.instant('FORM.WARNINGS.OVERRUN_DISTRIBUTION', { value : vm.diffAmount });

    if (DistributionForm.$invalid || vm.invalidDistribution) {
      return Notify.danger('FORM.ERRORS.INVALID');
    }

    return DistributionCenter.proceedDistribution(vm.transaction)
      .then(() => {
        Notify.success('FORM.INFO.DISTRIBUTION_SUCCESSFULLY');
        cancel();
        $state.go(path, null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  function cancel() {
    ModalInstance.close();
  }
}
