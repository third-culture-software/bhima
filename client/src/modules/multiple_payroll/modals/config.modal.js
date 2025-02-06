angular.module('bhima.controllers')
  .controller('ConfigPaymentModalController', ConfigPaymentModalController);

ConfigPaymentModalController.$inject = [
  '$state', 'NotifyService', 'appcache', 'EmployeeService', 'MultiplePayrollService', 'PayrollConfigurationService',
  'SessionService', 'params', '$q',
];

/**
 * @function ConfigPaymentModalController
 *
 * @description
 *  Configures an employee for payment, allowing the user to adjust the employee's remuneration
 *  as needed.
 *
 *  Here is how this works.  When the modal is loaded, the payment period information and employee
 *  information is presented to the user for completeness.
 *
 *  The user is allowed to change the following fields:
 *   1. The base employee base salary
 *   2. The days worked this payment period
 *   3. Any of the payment rubrics assigned to the employee.
 *
 *  The number of days worked defaults to the same number of days as in the payment period.
 */
function ConfigPaymentModalController(
  $state, Notify, AppCache, Employees, MultiplePayroll, PayConfig, Session, params, $q,
) {
  const vm = this;
  const cache = AppCache('multiple-payroll-grid');

  vm.config = {};
  vm.payroll = {};

  vm.enterprise = Session.enterprise;

  if (params.employeeUuid) {
    cache.stateParams = params;
    vm.stateParams = cache.stateParams;
  } else {
    vm.stateParams = cache.stateParams;
  }

  const { employeeUuid, paymentPeriodId } = vm.stateParams;

  // exposed methods
  vm.submit = submit;

  // TODO(@jniles) - update this to only include the values needed.
  function startup() {
    vm.loading = true;

    $q.all([
      Employees.read(employeeUuid),
      Employees.advantage(employeeUuid),
      PayConfig.read(paymentPeriodId),
    ])
      .then(([employee, advantages, period]) => {
        vm.employee = employee;
        vm.advantages = advantages;
        vm.period = period;

        // Check if the employee has an individual salary, and set their basic salary to it if so
        if (vm.employee.individual_salary) {
          vm.employee.basic_salary = vm.employee.individual_salary;
        }

        vm.payroll.value = {};

        const parameters = {
          dateFrom : period.dateFrom,
          dateTo : period.dateTo,
          employeeUuid,
        };

        return MultiplePayroll.getConfiguration(paymentPeriodId, parameters);
      })
      .then((configurations) => {
        // TODO(@jniles) - fix these configurations to be structured on the server side.
        const [
          rubrics,
          ,,,,
          validOffdays,
          validHolidays,
          [workingDays],
        ] = configurations;

        vm.rubConfigured = rubrics;

        vm.configurations = configurations;
        vm.payroll.off_days = validOffdays.length || 0;
        vm.payroll.nb_holidays = validHolidays.length || 0;

        vm.advantages.forEach((advantage) => {
          vm.rubConfigured.forEach((rub) => {
            if (advantage.rubric_payroll_id === rub.rubric_payroll_id) {
              vm.payroll.value[rub.abbr] = advantage.value;
            }
          });
        });

        const availableWorkingDays = workingDays.working_day - (vm.payroll.off_days + vm.payroll.nb_holidays);

        vm.payroll.working_day = availableWorkingDays;
        vm.maxWorkingDays = availableWorkingDays;
      })
      .catch(Notify.handleError)
      .finally(() => { vm.loading = false; });
  }

  // submit the data to the server from all two forms (update, create)
  function submit(ConfigPaymentForm) {
    if (ConfigPaymentForm.$invalid) {
      return Notify.danger('FORM.ERRORS.INVALID');
    }

    vm.payroll.employee = vm.employee;
    vm.payroll.currency_id = vm.enterprise.currency_id;

    /* eslint-disable prefer-destructuring */
    vm.payroll.holidays = vm.configurations[2];
    vm.payroll.iprScales = vm.configurations[4];
    vm.payroll.offDays = vm.configurations[5];
    vm.payroll.daysPeriod = vm.configurations[7][0];
    /* eslint-enable prefer-destructuring */

    vm.payroll.periodDateTo = vm.period.dateTo;

    return MultiplePayroll.setConfiguration(paymentPeriodId, vm.payroll)
      .then(() => {
        Notify.success('FORM.INFO.CONFIGURED_SUCCESSFULLY');
        $state.go('multiple_payroll', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  startup();
}
