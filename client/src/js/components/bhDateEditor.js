angular.module('bhima.components')
  .component('bhDateEditor', {
    templateUrl : 'modules/templates/bhDateEditor.tmpl.html',
    controller : bhDateEditorController,
    bindings : {
      dateValue : '<', // one-way binding
      onChange : '&',
      minDate : '<?',
      required : '<?',
      maxDate : '<?',
      allowFutureDate : '<?',
      disabled : '<?',
      dateFormat : '@?',
      label : '@?',
      limitMinFiscal : '@?',
    },
  });

bhDateEditorController.$inject = ['bhConstants', 'SessionService', 'FiscalService'];

/**
 * bhDateEditor Component
 *
 * A component to deal with date, it lets a user choose a date by either typing
 * into an <input> or clicking a calendar dropdown.  It wraps the
 * uib-date-picker to provide the dropdown calendar functionality.
 *
 * An optional limit-min-fiscal flag can be provided that will limit the date
 * selection to after the start of enterprise financial records - note that
 * limit-min-fiscal will *not* override min-date, it will only be applied if
 * min-date has not been set.
 * @param bhConstants
 * @param Session
 * @param Fiscal
 * @example
 * <bh-date-editor
 *  date-value="Ctrl.date"
 *  on-change="Ctrl.onDateChange(date)"
 *  date-format="'yyyy-MM-dd'"
 *  min-date="Ctrl.min"
 *  max-date="Ctrl.max"
 *  limit-min-fiscal
 *  disabled="Ctrl.isDisabled">
 * </bh-date-editor>
 * @module components/bhDateEditor
 */
function bhDateEditorController(bhConstants, Session, Fiscal) {
  const $ctrl = this;

  $ctrl.editMode = false;
  $ctrl.dateFormat = bhConstants.dayOptions.format;

  $ctrl.$onInit = () => {
    $ctrl.label = $ctrl.label || 'FORM.LABELS.DATE';
    $ctrl.allowFutureDate = $ctrl.allowFutureDate || false;

    // options to be passed to datepicker-option
    $ctrl.options = {
      minDate : $ctrl.minDate,
    };

    // if required is undefined, default to not being required
    if (!angular.isDefined($ctrl.required)) {
      $ctrl.required = false;
    }

    if (!$ctrl.allowFutureDate) {
      $ctrl.options.maxDate = $ctrl.maxDate || new Date();
    }

    // fetch and apply the first fiscal year start date ONLY if a min date hasn't
    // been specified
    if (angular.isDefined($ctrl.limitMinFiscal) && !angular.isDefined($ctrl.minDate)) {
      Fiscal.getEnterpriseFiscalStartDate(Session.enterprise.id)
        .then((response) => {
          $ctrl.options.minDate = new Date(response.start_date);
        });
    }
  };

  // fires the onChange() callback
  $ctrl.onDateChange = () => {
    if (!$ctrl.allowFutureDate) {
      const dt = (typeof $ctrl.dateValue === 'string') ? new Date($ctrl.dateValue) : $ctrl.dateValue;
      const check = new Date() >= dt;
      if (!check) {
        delete $ctrl.dateValue;
      }
    }
    $ctrl.onChange({ date : $ctrl.dateValue });
  };

  // opens/closes the date dropdown
  $ctrl.toggleEditMode = () => {
    $ctrl.editMode = !$ctrl.editMode;
  };
}
