angular.module('bhima.components')
  .component('bhMultipleCashboxSelect', {
    templateUrl : 'modules/templates/bhMultipleCashBoxSelect.tmpl.html',
    controller  : MultipleCashboxSelectController,
    bindings    : {
      onChange : '&',
      cashboxIds : '<?',
      label : '@?',
      required : '<?',
    },
  });

MultipleCashboxSelectController.$inject = [
  'CashboxService', 'NotifyService',
];

/**
 * Multiple Cashbox Selection Component
 * @param Cashbox
 * @param Notify
 */
function MultipleCashboxSelectController(Cashbox, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    // label to display
    $ctrl.label = $ctrl.label || 'FORM.LABELS.CASHBOX';

    // init the model
    $ctrl.cashboxIds = $ctrl.cashboxIds || [];

    // load all Cashbox
    Cashbox.read()
      .then(cashboxes => {
        cashboxes.sort((a, b) => a.label > b.label);
        $ctrl.cashboxes = cashboxes;
      })
      .catch(Notify.handleError);
  };

  $ctrl.handleChange = (cashboxes) => $ctrl.onChange({ cashboxes });
}
