/**
 * @file bhHiddenField
 * @description
 * This component allows a programmer to optionally hide a field in a form at
 * startup that may toggled open by the user if they need it.
 */
angular.module('bhima.components')
  .component('bhHiddenField', {
    templateUrl : 'modules/templates/bhHiddenField.html',
    transclude : true,
    controller : bhHiddenFieldController,
    bindings : {
      showText : '@',
      hideText : '@',
    },
  });

/**
 *
 */
function bhHiddenFieldController() {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.visible = false;
  };

  $ctrl.toggleVisibility = function toggleVisibility() {
    $ctrl.visible = !$ctrl.visible;
  };
}
