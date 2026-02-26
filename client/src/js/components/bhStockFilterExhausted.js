angular.module('bhima.components')
  .component('bhStockFilterExhausted', {
    bindings : {
      value : '<',
      label : '@',
      name : '@',
      excludeLabel : '@',
      includeLabel : '@',
      includeOnlyLabel : '@',
      helpText : '@?',
      onChangeCallback : '&',
    },
    transclude : true,
    templateUrl : 'modules/templates/bhStockFilterExhausted.tmpl.html',
    controller : StockFilterExhaustedController,
  });

/**
 * @function StockFilterExhaustedController
 * @description
 * This component simplifies the stock filtering for exhausted stock option
 */
function StockFilterExhaustedController() {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    $ctrl.value = Number.parseInt($ctrl.value, 10);
  };

  $ctrl.onChange = (value) => {
    $ctrl.onChangeCallback({ value });
  };
}
