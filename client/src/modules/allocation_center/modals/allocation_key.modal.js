angular.module('bhima.controllers')
  .controller('DistributionKeyModalController', DistributionKeyModalController);

DistributionKeyModalController.$inject = [
  '$state', 'NotifyService', 'DistributionCenterService',
  'SessionService', '$uibModalInstance', 'CostCenterService', 'settings', '$translate', 'util',
];

/**
 *
 * @param $state
 * @param Notify
 * @param DistributionCenter
 * @param Session
 * @param ModalInstance
 * @param CostCenters
 * @param settings
 * @param $translate
 * @param util
 */
function DistributionKeyModalController(
  $state, Notify, DistributionCenter, Session, ModalInstance,
  CostCenters, settings, $translate, util,
) {
  const vm = this;

  vm.settings = settings;
  vm.cancel = cancel;
  vm.enterprise = Session.enterprise;
  vm.settings.values = {};

  // exposed methods
  vm.submit = submit;
  vm.reset = reset;

  CostCenters.read()
    .then((costCenter) => {
      vm.principalCostCenter = costCenter.filter(item => {
        return item.is_principal;
      });

      if (vm.principalCostCenter.length && vm.settings.settingsValues.length) {
        vm.principalCostCenter.forEach(item => {
          vm.settings.settingsValues.forEach(values => {
            if (item.id === parseInt(values.principal_cost_center_id, 10)) {
              vm.settings.values[item.id] = values.rate;
            }
          });
        });
      }

      if (!vm.principalCostCenter.length) {
        vm.noPrincilCostCenter = true;
      }

    })
    .catch(Notify.handleError);

  /**
   *
   * @param DistributionKeyForm
   */
  function submit(DistributionKeyForm) {
    let sumDistributed = 0;

    Object.keys(vm.settings.values).forEach((key) => {
      sumDistributed += vm.settings.values[key];
    });

    // sumDistributed sum must always be 100 for 100%
    sumDistributed = util.roundDecimal(sumDistributed, 0);

    vm.invalidBreakDown = sumDistributed !== 100;
    vm.diffPercentage = Math.abs(sumDistributed - 100);

    vm.errorMessage = (sumDistributed < 100)
      ? $translate.instant('FORM.WARNINGS.REMAINS_DISTRIBUTION', { value : `${vm.diffPercentage} %` })
      : $translate.instant('FORM.WARNINGS.OVERRUN_DISTRIBUTION', { value : `${vm.diffPercentage} %` });

    if (DistributionKeyForm.$invalid || vm.invalidBreakDown) {
      return Notify.danger('FORM.ERRORS.INVALID');
    }

    return DistributionCenter.proceedDistributionKey(vm.settings)
      .then(() => {
        Notify.success('FORM.INFO.DISTRIBUTION_SUCCESSFULLY');
        cancel();
        $state.go('allocation_key', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function cancel() {
    ModalInstance.close();
  }

  /**
   *
   * @param auxiliaryCostCenter
   */
  function reset(auxiliaryCostCenter) {
    return DistributionCenter.resetDistributionKey(auxiliaryCostCenter)
      .then(() => {
        Notify.success('FORM.INFO.DISTRIBUTION_SUCCESSFULLY');
        cancel();
        $state.go('allocation_key', null, { reload : true });
      })
      .catch(Notify.handleError);
  }
}
