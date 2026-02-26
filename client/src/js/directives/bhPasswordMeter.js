angular.module('bhima.directives')
  .directive('bhPasswordMeter', PasswordValidatorDirective);

PasswordValidatorDirective.$inject = ['PasswordMeterService'];

/**
 * Password Validator Directive
 * @param PasswordMeterService
 * @description
 * This directive provides a generic password validation.
 * The validation condition is defined at  PasswordMeterService
 * @example
 * <input name="pwd" type="password" bh-password-meter>
 *
 * <div ng-messages="form.pwd.$error">
 *   <p ng-messages-include="modules/templates/messages.tmpl.html"></p>
 * </div>
 * @module directives/PasswordValidatorDirective
 */
function PasswordValidatorDirective(PasswordMeterService) {
  return {
    restrict : 'A',
    require : 'ngModel',
    link : (scope, element, attrs, ctrl) => {
      ctrl.$validators.password = (modelValue, viewValue) => PasswordMeterService.validate(viewValue);
    },
  };
}
