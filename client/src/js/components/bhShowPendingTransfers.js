angular.module('bhima.components')
  .component('bhShowPendingTransfers', {
    bindings : {
      value : '<',
      label : '@',
      name : '@',
      helpText : '@?',
      onChangeCallback : '&',
    },
    transclude : true,
    templateUrl : 'modules/templates/bhShowPendingTransfers.tmpl.html',
    controller : ShowPendingTransfersController,
  });

/**
 * @function ShowPendingTransfersController
 * @description
 * This component simplifies the stock filtering for exhausted stock option
 */
function ShowPendingTransfersController() {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    $ctrl.value = Number.parseInt($ctrl.value, 10);
  };

  $ctrl.onChange = (value) => {
    $ctrl.onChangeCallback({ value });
  };
}
