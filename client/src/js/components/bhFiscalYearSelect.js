angular.module('bhima.components')
  .component('bhFiscalYearSelect', {
    templateUrl : 'modules/templates/bhFiscalYearSelect.tmpl.html',
    controller : FiscalYearSelect,
    transclude  : true,
    bindings : {
      onSelectFiscalCallback : '&',
      fiscalId : '<?',
      required : '<?',
    },
  });

FiscalYearSelect.$inject = ['FiscalService'];

/**
 *
 * @param FiscalYears
 */
function FiscalYearSelect(FiscalYears) {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    FiscalYears.read()
      .then(years => {
        $ctrl.years = years;
        [$ctrl.selectedYear] = $ctrl.years.filter(fy => fy.id === $ctrl.fiscalId);
      });
  };

  $ctrl.onChange = fiscalYear => {
    $ctrl.onSelectFiscalCallback({ fiscalYear });
  };
}
