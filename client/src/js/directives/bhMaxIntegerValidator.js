angular.module('bhima.directives')
  .directive('bhMaxInteger', MaxIntegerValidatorDirective);

MaxIntegerValidatorDirective.$inject = ['bhConstants'];

/**
 * Max Integer Validator Directive
 * @param bhConstants
 * @description
 * Contrary to the name, this doesn't validate if a number is an integer. Rather,
 * it checks that the value will not overflow the maximum allowed MySQL value.
 */
function MaxIntegerValidatorDirective(bhConstants) {
  return {
    restrict : 'A',
    require : 'ngModel',
    link : (scope, element, attrs, ctrl) => {
      ctrl.$validators.maxInteger = (modelValue, viewValue) => {
        const { MAX_INTEGER } = bhConstants.precision;
        const value = Number(viewValue);
        return value <= MAX_INTEGER;
      };
    },
  };
}
