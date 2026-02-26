angular.module('bhima.components')
  .component('bhDischargeSelect', {
    bindings : {
      value : '<?',
      onChangeCallback : '&',
    },
    templateUrl : 'js/components/bhDischargeSelect/bhDischargeSelect.html',
    controller : DischargeSelectController,
  });

DischargeSelectController.$inject = ['DischargeTypeService'];

/**
 *
 * @param DischargeTypes
 */
function DischargeSelectController(DischargeTypes) {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    DischargeTypes.read()
      .then(data => {
        const hasDefaultValue = angular.isDefined($ctrl.value);
        if (!hasDefaultValue && data.length) {
          $ctrl.value = data[0].id;
        }
        $ctrl.dischargeTypeList = data;
      });
  };

  $ctrl.onChange = (value) => {
    $ctrl.onChangeCallback({ dischargeType : value });
  };
}
