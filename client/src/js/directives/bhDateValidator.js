angular.module('bhima.directives')
  .directive('bhDateValidator', DateValidatorDirective);

DateValidatorDirective.$inject = ['$parse'];

/**
 * Date Validator Directive
 *
 * This directive is to address the problem of dealing with uib-datepicker
 * popup's lack of input validation.  It should be used on an input with the
 * standard datepicker, and takes in the datepicker's options.
 *
 * See https://github.com/angular-ui/bootstrap/issues/4664 for more information.
 *
 * @example
 * <input
 *   type="text"
 *   uib-datepicker-popup="dd-MM-yyyy"
 *   datepicker-options="$ctrl.options"
 *   bh-date-validator="$ctrl.options"
 *   required>
 *
 * @module directives/bhDateValidator
 */
function DateValidatorDirective($parse) {
  return {
    restrict : 'A',
    require  : 'ngModel',
    priority : 10,
    link     : function dateValidatorLink(scope, element, attrs, ctrl) {
      ctrl.$validators.dateRange = function (model) {

        // note that we cannot use an isolated scope since it conflicts with
        // the $uibDatepickerPopup directive.  So, we must $parse the scope to
        // access the date options.
        const options = $parse(attrs.bhDateValidator)(scope);

        // we are not validating a date, so return early.
        // this prevents collison with required directive
        if (!(model instanceof Date)) { return true; }

        // check the minimum date and report failure
        if (options.minDate && model < options.minDate) { return false; }

        // check the maximum date and report failure
        if (options.maxDate && model > options.maxDate) { return false; }

        // if nothing has failed yet, return success
        return true;
      };
    },
  };
}
