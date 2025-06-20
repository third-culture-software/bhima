angular.module('bhima.components')
  .component('bhIndicator', {
    templateUrl : 'js/components/bhIndicator/bhIndicator.html',
    controller  : IndicatorController,
    transclude  : true,
    bindings    : {
      key : '@',
      label : '@',
      value : '<',
      valueSymbol : '@?',
      decimals : '@?',
      description : '@?',
      calcul : '@?',
      norm : '@?',
      minValue : '@?',
      maxValue : '@?',
      dependencies : '<?', // an array of object [{ key:..., value:...}],
      periodicValues : '<?', // periodic values [{ period:..., value:... }]
    },
  });

function IndicatorController() {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    if ($ctrl.value && $ctrl.minValue && !$ctrl.maxValue) {
      $ctrl.isAcceptable = $ctrl.value >= $ctrl.minValue;
    }

    if ($ctrl.value && !$ctrl.minValue && $ctrl.maxValue) {
      $ctrl.isAcceptable = $ctrl.value <= $ctrl.maxValue;
    }

    if ($ctrl.value && $ctrl.minValue && $ctrl.maxValue) {
      $ctrl.isAcceptable = $ctrl.value >= $ctrl.minValue && $ctrl.value <= $ctrl.maxValue;
    }

    if (!$ctrl.minValue && !$ctrl.maxValue) {
      $ctrl.isAcceptable = true;
    }
  };

  $ctrl.$onChanges = changes => {
    if (changes.value && changes.value.currentValue) {
      if ($ctrl.value && $ctrl.minValue && !$ctrl.maxValue) {
        $ctrl.isAcceptable = $ctrl.value >= $ctrl.minValue;
      }

      if ($ctrl.value && !$ctrl.minValue && $ctrl.maxValue) {
        $ctrl.isAcceptable = $ctrl.value <= $ctrl.maxValue;
      }

      if ($ctrl.value && $ctrl.minValue && $ctrl.maxValue) {
        $ctrl.isAcceptable = $ctrl.value >= $ctrl.minValue && $ctrl.value <= $ctrl.maxValue;
      }
    }
  };
}
