angular.module('bhima.components')
  .component('bhCashboxSelect', {
    templateUrl : 'modules/templates/bhCashboxSelect.tmpl.html',
    controller  : CashboxSelectController,
    transclude  : true,
    bindings    : {
      cashboxId         : '<',
      onSelectCallback  : '&',
      disable           : '<?',
      name              : '@?',
      label             : '@?',
      required          : '<?',
      validationTrigger : '<?',
      restrictToUser    : '<?',
      isAuxiliary       : '<?',
      isPrimary         : '<?',
    },
  });

CashboxSelectController.$inject = [
  'CashboxService', 'NotifyService', 'SessionService',
];

/**
 * Cashbox selection component
 * @param Cashbox
 * @param Notify
 * @param Session
 */
function CashboxSelectController(Cashbox, Notify, Session) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    // default for form name
    $ctrl.name = $ctrl.name || 'CashboxForm';

    // translated label for the form input
    $ctrl.label = $ctrl.label
      || $ctrl.required ? 'FORM.SELECT.CASHBOX' : 'FORM.SELECT.CASHBOX_OPTIONAL';

    const restrictCashboxList = angular.isDefined($ctrl.restrictToUser)
      ? $ctrl.restrictToUser : true;

    const params = { detailed : 1 };

    if (restrictCashboxList) {
      params.user_id = Session.user.id;
    }

    if ($ctrl.isAuxiliary) {
      params.is_auxiliary = 1;
    }

    if ($ctrl.isPrimary) {
      params.is_auxiliary = 0;
    }

    // load all Cashbox
    Cashbox.read(null, params)
      .then(cashboxes => {
        cashboxes.forEach(cashbox => {
          cashbox.hrlabel = `${cashbox.label} ${cashbox.symbol}`;
        });

        $ctrl.cashboxes = cashboxes;
      })
      .catch(Notify.handleError);

    $ctrl.valid = true;
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = ($item) => {
    $ctrl.onSelectCallback({ cashbox : $item });
  };
}
