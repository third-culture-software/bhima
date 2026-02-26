angular.module('bhima.components')
  .component('bhPayrollStatusSelect', {
    templateUrl : 'modules/templates/bhPayrollStatusSelect.tmpl.html',
    controller  : PayrollStatusSelectController,
    bindings    : {
      onChange : '&',
      statusIds : '<?',
      label : '@?',
      required : '<?',
    },
  });

PayrollStatusSelectController.$inject = [
  'PayrollConfigurationService', 'NotifyService', '$translate',
];

/**
 * purchase status Selection Component
 * @param Payroll
 * @param Notify
 * @param $translate
 */
function PayrollStatusSelectController(Payroll, Notify, $translate) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    // label to display
    $ctrl.label = $ctrl.label || 'FORM.LABELS.STATUS';

    // init the model
    $ctrl.selectedPayrollStatus = $ctrl.statusIds || [];

    // load all Payroll status
    Payroll.paymentStatus()
      .then((status) => {
        status.forEach((item) => {
          item.plainText = $translate.instant(item.text);
        });
        $ctrl.paymentStatus = status;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component
  $ctrl.handleChange = paymentStatus => $ctrl.onChange({ paymentStatus });
}
