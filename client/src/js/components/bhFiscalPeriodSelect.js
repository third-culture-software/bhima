angular.module('bhima.components')
  .component('bhFiscalPeriodSelect', {
    bindings : {
      fiscalId : '<',
      periodFromId : '<',
      periodToId : '<',
      onSelectPeriodFromCallback : '&',
      onSelectPeriodToCallback : '&',
      onSelectFiscalCallback : '&',
    },
    templateUrl : 'modules/templates/bhFiscalPeriodSelect.tmpl.html',
    controller : FiscalPeriodSelect,
  });

FiscalPeriodSelect.$inject = ['FiscalService', 'moment'];

/**
 *
 * @param Fiscal
 * @param moment
 */
function FiscalPeriodSelect(Fiscal, moment) {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    Fiscal.read()
      .then(fiscals => {
        $ctrl.fiscals = fiscals;
      });
  };

  $ctrl.$onChanges = (changes) => {

    if (changes.fiscalId && $ctrl.fiscalId) {
      $ctrl.selectedFiscal = $ctrl.fiscalId;
      loadPeriodsForFiscalYear($ctrl.fiscalId);
    }

  };

  $ctrl.loadPeriod = fiscalId => {
    $ctrl.onSelectFiscalCallback({ fiscal : fiscalId });
    loadPeriodsForFiscalYear(fiscalId);
  };

  /**
   *
   * @param a
   * @param b
   */
  function sortDates(a, b) {
    if (a.start_date > b.start_date) {
      return 1;
    }
    return -1;
  }

  /**
   *
   * @param fiscalId
   */
  function loadPeriodsForFiscalYear(fiscalId) {
    Fiscal.getPeriods(fiscalId)
      .then(periods => {
        $ctrl.periods = periods

          // get rid of opening balances
          .filter(p => p.number > 0)

          // format the date in a supported locale
          .map(p => {
            p.hrLabel = moment(p.start_date).format('MMMM YYYY');
            return p;
          });

        $ctrl.periods.forEach(period => {
          if (period.id === $ctrl.periodFromId) {
            $ctrl.selectedPeriodFrom = period;
            $ctrl.onSelectPeriodFrom(period);
          }
          if (period.id === $ctrl.periodToId) {
            $ctrl.selectedPeriodTo = period;
            $ctrl.onSelectPeriodTo(period);
          }
        });
        // sure the period are ordered in an ASC fashion
        $ctrl.periods.sort(sortDates);
      });
  }

  // filters out periods that are before the current period
  $ctrl.filterLaterPeriods = (period) => {
    // show all periods if there is no start period
    if (!$ctrl.selectedPeriodFrom) {
      return true;
    }

    return (period.number >= $ctrl.selectedPeriodFrom.number);
  };

  $ctrl.onSelectPeriodFrom = period => $ctrl.onSelectPeriodFromCallback({ period });
  $ctrl.onSelectPeriodTo = period => $ctrl.onSelectPeriodToCallback({ period });
}
