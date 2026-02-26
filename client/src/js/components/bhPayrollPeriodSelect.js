angular.module('bhima.components')
  .component('bhPayrollPeriodSelect', {
    templateUrl : 'modules/templates/bhPayrollPeriodSelect.tmpl.html',
    controller  : PayrollPeriodSelectController,
    transclude  : true,
    bindings    : {
      payrollConfigurationId : '<',
      onSelectCallback : '&',
      required         : '<?',
      label            : '@?',
    },
  });

PayrollPeriodSelectController.$inject = [
  'PayrollConfigurationService', 'NotifyService',
];

/**
 * Payroll Period Select Controller
 * @param PayrollConfig
 * @param Notify
 */
function PayrollPeriodSelectController(PayrollConfig, Notify) {
  const $ctrl = this;

  // fired at the beginning of the Payroll Configuration select
  $ctrl.$onInit = function $onInit() {
    // translated label for the form input
    $ctrl.label = $ctrl.label || 'FORM.LABELS.PERIOD_PAYMENT';

    if (!angular.isDefined($ctrl.required)) {
      $ctrl.required = true;
    }

    PayrollConfig.read()
      .then(payrollConfigs => {
        $ctrl.payrollConfigs = payrollConfigs;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = payrollConfig => {
    $ctrl.onSelectCallback({ payrollConfig });
  };
}
