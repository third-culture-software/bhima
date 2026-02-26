angular.module('bhima.components')
  .component('bhDebtorGroupSelect', {
    templateUrl : 'modules/templates/bhDebtorGroupSelect.tmpl.html',
    controller  : DebtorGroupSelectController,
    transclude  : true,
    bindings    : {
      debtorGroupUuid   : '<',
      onSelectCallback  : '&',
      disable           : '<?',
      name              : '@?',
      label             : '@?',
      required          : '<?',
      filter            : '<?',
      warnNoGroup       : '<?',
    },
  });

DebtorGroupSelectController.$inject = ['DebtorGroupService'];

/**
 * Debtor Group selection component
 * @param DebtorGroup
 */
function DebtorGroupSelectController(DebtorGroup) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    const filters = $ctrl.filter || {};

    // translated label for the form input
    $ctrl.label = $ctrl.label || 'FORM.LABELS.DEBTOR_GROUP';

    $ctrl.required = angular.isDefined($ctrl.required) ? $ctrl.required : true;

    // load all Debtor Group
    DebtorGroup.read(null, filters)
      .then(handleDebtorGroups);

    $ctrl.valid = true;
  };

  /**
   *
   * @param debtorGroups
   */
  function handleDebtorGroups(debtorGroups) {
    $ctrl.noDebtorGroups = !debtorGroups.length;
    $ctrl.debtorGroups = debtorGroups;
  }

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = debtorGroup => {
    $ctrl.onSelectCallback({ debtorGroup });
  };
}
