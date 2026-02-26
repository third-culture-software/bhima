angular.module('bhima.directives')
  .directive('bhInteger', IntegerValidatorDirective);

IntegerValidatorDirective.$inject = [];

/**
 * Integer Validator Directive
 *
 * This directive provides a generic Integer constraint that can be used any
 * input with a valid ngModel.
 * @example
 * <input name="int" type="number" bh-integer>
 *
 * <div ng-messages="form.int.$error">
 *   <p ng-messages-include="modules/templates/messages.tmpl.html"></p>
 * </div>
 * @module directives/IntegerValidatorDirective
 */
function IntegerValidatorDirective() {
  return {
    restrict : 'A',
    require : 'ngModel',
    link : function integerLink(scope, element, attrs, ctrl) {
      const INTEGER_PATTERN = /^-?\d+$/;

      ctrl.$validators.integer = (modelValue, viewValue) => {

        // test provided input against integer REGEX, if the value returned is
        // true it matches an integers signature
        if (INTEGER_PATTERN.test(viewValue)) {
          return true;
        }

        return false;
      };
    },
  };
}
