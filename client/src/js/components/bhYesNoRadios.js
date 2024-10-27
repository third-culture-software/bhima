angular.module('bhima.components')
  .component('bhYesNoRadios', {
    bindings : {
      value : '<?',
      label : '@',
      name : '@',
      helpText : '@?',
      onChangeCallback : '&',
      required : '<?',
    },
    transclude  : true,
    templateUrl : 'modules/templates/bhYesNoRadios.tmpl.html',
    controller : YesNoRadioController,
  });

/**
 * @function YesNoRadioController
 *
 * @description
 * This component makes yes/no options a bit easier to navigate.
 */
function YesNoRadioController() {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    // only attempt to parse the input if the input is defined
    if (angular.isDefined($ctrl.value)) {
      $ctrl.value = Number.parseInt($ctrl.value, 10);
    }

    // ensure default behavior of required if nothing
    // is passed in is preserved.
    if (!angular.isDefined($ctrl.required)) {
      $ctrl.required = true;
    }
  };

  $ctrl.onChange = (value) => {
    $ctrl.onChangeCallback({ value });
  };
}
