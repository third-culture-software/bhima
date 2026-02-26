angular.module('bhima.components')
  .component('bhStrengthMeter', {
    template : `
      <div class='strength-meter' ng-if="$ctrl.showStrengthMeter">
       <div class='strength-meter-fill' data-strength='{{$ctrl.counter()}}'></div>
      </div>`,
    bindings : {
      password : '<',
    },
    controller : StrengthMeterController,
  });

StrengthMeterController.$inject = [
  'PasswordMeterService', 'SessionService',
];

/**
 * @param PasswordMeterService
 * @param Session
 * @function StrengthMeterController
 * @description
 * This is a display only component that evaluates a password's strength as the
 * user types it.  It displays these values in a meter underneath the password
 * input.
 */
function StrengthMeterController(PasswordMeterService, Session) {

  this.$onInit = () => {
    this.showStrengthMeter = (Session.enterprise && Session.enterprise.settings.enable_password_validation)
     || !Session.enterprise;
    this.counter = () => PasswordMeterService.counter(this.password);
  };
}
