angular.module('bhima.components')
  .component('bhFiscalYearPeriodSelect', {
    templateUrl : 'js/components/bhFiscalYearPeriodSelect/bhFiscalYearPeriodSelect.html',
    controller : FiscalYearPeriodSelect,
    transclude  : true,
    bindings : {
      onSelectCallback : '&',
      fiscalId : '<?',
      periodId : '<?',
    },
  });

/**
 *
 */
function FiscalYearPeriodSelect() {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    $ctrl.selected = {};
  };

  /**
   * @param fiscal
   * @function onSelectFiscalYear
   * @description
   * Callback when the fiscal year is selected using the bh-fiscal-select
   * component.
   */
  $ctrl.onSelectFiscalYear = fiscal => {
    angular.extend($ctrl.selected, { fiscal });
  };

  $ctrl.onSelectPeriod = period => {
    angular.extend($ctrl.selected, { period });
    $ctrl.onSelectCallback({ selected : $ctrl.selected });
  };
}
