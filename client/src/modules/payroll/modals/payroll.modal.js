angular.module('bhima.controllers')
  .controller('PayrollConfigModalController', PayrollConfigModalController);

PayrollConfigModalController.$inject = [
  '$state', 'PayrollConfigurationService', 'NotifyService', 'appcache', 'moment', 'params',
];

/**
 *
 * @param $state
 * @param PayrollConfigurations
 * @param Notify
 * @param AppCache
 * @param moment
 * @param params
 */
function PayrollConfigModalController($state, PayrollConfigurations, Notify, AppCache, moment, params) {
  const vm = this;
  vm.payroll = {};
  const cache = AppCache('PayrollModal');

  if (params.isCreateState || params.id) {
    cache.stateParams = params;
    vm.stateParams = cache.stateParams;
  } else {
    vm.stateParams = cache.stateParams;
  }

  vm.isCreateState = vm.stateParams.isCreateState;

  // exposed methods
  vm.submit = submit;
  vm.onSelectRubricConfig = onSelectRubricConfig;
  vm.onSelectAccountConfig = onSelectAccountConfig;
  vm.onSelectIprConfig = onSelectIprConfig;
  vm.onSelectWeekendConfig = onSelectWeekendConfig;
  vm.onSelectEmployeeConfig = onSelectEmployeeConfig;
  vm.cancel = cancel;

  vm.clear = clear;

  if (!vm.isCreateState) {
    PayrollConfigurations.read(vm.stateParams.id)
      .then(payroll => {
        payroll.dateFrom = new Date(payroll.dateFrom);
        payroll.dateTo = new Date(payroll.dateTo);
        vm.payroll = payroll;
      })
      .catch(Notify.handleError);
  }

  // callback for Rubric Configuration select
  /**
   *
   * @param rubric
   */
  function onSelectRubricConfig(rubric) {
    vm.payroll.config_rubric_id = rubric.id;
  }

  // callback for Account Configuration select
  /**
   *
   * @param account
   */
  function onSelectAccountConfig(account) {
    vm.payroll.config_accounting_id = account.id;
  }

  // callback for Ipr Configuration select
  /**
   *
   * @param ipr
   */
  function onSelectIprConfig(ipr) {
    vm.payroll.config_ipr_id = ipr.id;
  }

  // Callback for weekend configuration select
  /**
   *
   * @param week
   */
  function onSelectWeekendConfig(week) {
    vm.payroll.config_weekend_id = week.id;
  }

  /**
   *
   * @param employee
   */
  function onSelectEmployeeConfig(employee) {
    vm.payroll.config_employee_id = employee.id;
  }

  // deletes a filter from the custom filter object
  /**
   *
   * @param key
   */
  function clear(key) {
    delete vm.payroll[key];
  }

  /**
   *
   */
  function cancel() {
    $state.go('payroll', null, { reload : true });
  }

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param payrollForm
   */
  function submit(payrollForm) {
    if (payrollForm.$invalid) { return 0; }

    vm.payroll.dateFrom = moment(vm.payroll.dateFrom).format('YYYY-MM-DD');
    vm.payroll.dateTo = moment(vm.payroll.dateTo).format('YYYY-MM-DD');

    const promise = (vm.isCreateState)
      ? PayrollConfigurations.create(vm.payroll)
      : PayrollConfigurations.update(vm.payroll.id, vm.payroll);

    return promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'FORM.INFO.CREATE_SUCCESS' : 'FORM.INFO.UPDATE_SUCCESS';
        Notify.success(translateKey);
        $state.go('payroll', null, { reload : true });
      })
      .catch(Notify.handleError);
  }
}
