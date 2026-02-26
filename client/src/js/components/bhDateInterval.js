/**
 * @name bhDateInterval
 * @description
 * The `bhDateInterval` component provide a means to select a date range
 * between two dates. The dates values returned are sent to dates models
 * given in date-from and date-to attributes.
 *
 * An optional flag `limit-min-fiscal` can be provided that limits the from and
 * to date inputs to not allow dates before the start of the first enterprise
 * fiscal year.
 * @example
 * ```html
 * <bh-date-interval date-from="$MyCtrl.dateFrom" date-to="$MyCtrl.dateTo">
 * </bh-date-interval>
 * ```
 */
angular.module('bhima.components')
  .component('bhDateInterval', {
    templateUrl : '/modules/templates/bhDateInterval.tmpl.html',
    controller : bhDateInterval,
    bindings : {
      dateFrom : '=', // date from
      dateTo : '=', // date to
      dateId : '@?', // date identifier
      required : '<?', // true or false
      onChange : '&?', // on change action
      canClear : '<?', // flag for displaying clear button
      label : '@?',
      mode : '@?', // the date mode (day|month|year)
      startDatePlaceholder : '@?',
      endDatePlaceholder : '@?',
      limitMinFiscal : '@?', // do not allow the minimum date to be before the first fiscal year
    },
  });

// dependencies injection
bhDateInterval.$inject = [
  'bhConstants', 'FiscalService', 'NotifyService',
  'SessionService', 'PeriodService', '$translate',
];

// controller definition
/**
 *
 * @param bhConstants
 * @param Fiscal
 * @param Notify
 * @param Session
 * @param PeriodService
 * @param $translate
 */
function bhDateInterval(bhConstants, Fiscal, Notify, Session, PeriodService, $translate) {
  const $ctrl = this;

  PeriodService.dateFormat = 'YYYY-MM-DD';
  // expose to the view
  $ctrl.search = search;
  $ctrl.clear = clear;
  $ctrl.lastDateFrom = null;
  $ctrl.lastDateTo = null;

  $ctrl.$onInit = () => {
    // specify if clear button can be displayed
    if (!angular.isDefined($ctrl.canClear)) {
      $ctrl.canClear = true;
    }

    $ctrl.options = [
      { translateKey : 'FORM.LABELS.TODAY', fn : day, range : 'day' },
      { translateKey : 'FORM.LABELS.THIS_WEEK', fn : week, range : 'week' },
      { translateKey : 'FORM.LABELS.THIS_MONTH', fn : month, range : 'month' },
      { translateKey : 'FORM.LABELS.THIS_YEAR', fn : year, range : 'year' },
    ];

    $ctrl.label = $ctrl.label || 'FORM.SELECT.DATE_INTERVAL';
    $ctrl.dateFormat = bhConstants.dayOptions.format;
    $ctrl.pickerFromOptions = { showWeeks : false };
    $ctrl.pickerToOptions = { showWeeks : false, minDate : $ctrl.dateFrom };
    $ctrl.startDatePlaceholder = $translate.instant($ctrl.startDatePlaceholder || 'FORM.LABELS.START_DATE');
    $ctrl.endDatePlaceholder = $translate.instant($ctrl.endDatePlaceholder || 'FORM.LABELS.END_DATE');
    $ctrl.dateRangeError = false;

    // if controller has requested limit-min-fiscal, fetch required information
    if (angular.isDefined($ctrl.limitMinFiscal)) {
      getMinimumFiscalYearDate();
    }

    startup();
  };

  /**
   *
   */
  function getMinimumFiscalYearDate() {
    Fiscal.getEnterpriseFiscalStartDate(Session.enterprise.id)
      .then(response => {
        $ctrl.pickerFromOptions.minDate = new Date(response.start_date);
      });
  }

  $ctrl.onChangeDate = () => {
    angular.extend($ctrl.pickerToOptions, { minDate : $ctrl.dateFrom });

    // Make sure dateTo >= dateFrom
    if ($ctrl.dateFrom && $ctrl.dateTo) {
      if ($ctrl.dateTo < $ctrl.dateFrom) {
        Notify.danger('ERRORS.ER_DATE_RANGE', 8000);
        $ctrl.dateTo = null;
        $ctrl.dateRangeError = true;
        return;
      }
      $ctrl.dateRangeError = false;
    }

    if ($ctrl.onChange) {
      $ctrl.onChange({ dateFrom : $ctrl.dateFrom, dateTo : $ctrl.dateTo });
    }
    if ($ctrl.dateFrom !== $ctrl.lastDateFrom || $ctrl.dateTo !== $ctrl.lastDateTo) {
      delete $ctrl.selected;
      $ctrl.lastDateFrom = $ctrl.dateFrom;
      $ctrl.lastDateTo = $ctrl.dateTo;
    }
  };

  /**
   *
   * @param selection
   */
  function search(selection) {
    $ctrl.selected = selection.translateKey;
    selection.fn();
    $ctrl.onChangeDate();
  }

  /**
   *
   * @param key
   */
  function setDateInterval(key) {
    $ctrl.dateFrom = new Date(PeriodService.index[key].limit.start());
    $ctrl.dateTo = new Date(PeriodService.index[key].limit.end());
    $ctrl.lastDateFrom = $ctrl.dateFrom;
    $ctrl.lastDateTo = $ctrl.dateTo;
  }

  /**
   *
   */
  function day() {
    setDateInterval('today');
  }

  /**
   *
   */
  function week() {
    setDateInterval('week');
  }

  /**
   *
   */
  function month() {
    setDateInterval('month');
  }

  /**
   *
   */
  function year() {
    setDateInterval('year');
  }

  /**
   *
   */
  function custom() {
    if ($ctrl.dateFrom) {
      $ctrl.dateFrom = new Date($ctrl.dateFrom);
    }

    if ($ctrl.dateTo) {
      $ctrl.dateTo = new Date($ctrl.dateTo);
    }
  }

  /**
   *
   */
  function clear() {
    delete $ctrl.dateFrom;
    delete $ctrl.dateTo;
    delete $ctrl.selected;
    $ctrl.lastDateFrom = null;
    $ctrl.lastDateTo = null;
  }

  /**
   *
   */
  function startup() {
    const option = ['day', 'week', 'month', 'year'].indexOf($ctrl.mode);

    // set the default option according the mode
    if (option !== -1) {
      search($ctrl.options[option]);
      angular.extend($ctrl.pickerFromOptions, { mode : $ctrl.mode });
    } else {
      custom();
    }
    // set clean mode
    if ($ctrl.mode === 'clean') {
      clear();
    }
  }
}
