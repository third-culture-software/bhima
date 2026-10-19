angular.module('bhima.components')
  .component('bhPercentageInput', {
    templateUrl : 'modules/templates/bhPercentageInput.tmpl.html',
    controller : PercentageInputController,
    bindings : {
      currencyId : '<',
      value : '<?',
      onChange : '&',
      label : '@?',
      symbol : '@?',
      disabled : '<?',
      min : '@?',
      max : '@?',
    },
  });

/**
 * Percentage Input Component
 *
 * This is a Percentage input form based on <input type="number"> with specific
 * validation based on the min and max value.
 */
function PercentageInputController() {
  const $ctrl = this;

  $ctrl.$onInit = function $onInit() {
    $ctrl.symbol = $ctrl.symbol || '%';
    $ctrl.min = $ctrl.min || 0;
    $ctrl.max = $ctrl.max || 100;
    $ctrl.label = $ctrl.label || 'FORM.LABELS.VALUE';
    $ctrl.percentValue = $ctrl.value;
  };

  $ctrl.$onChanges = function $onChanges(changes) {
    if (changes.value) {
      $ctrl.percentValue = changes.model.currentValue;
    }
  };

  $ctrl.updateValue = function updateValue() {
    $ctrl.onChange({ value: $ctrl.percentValue });
  };
}
