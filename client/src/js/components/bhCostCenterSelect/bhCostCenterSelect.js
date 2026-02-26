angular.module('bhima.components')
  .component('bhCostCenterSelect', {
    templateUrl : 'js/components/bhCostCenterSelect/bhCostCenterSelect.html',
    controller  : CostCenterSelectController,
    transclude  : true,
    bindings    : {
      costCenterId     : '<',
      filter           : '<',
      principal        : '<',
      onSelectCallback : '&',
      required         : '<?',
      disabled         : '<?',
      label            : '@?',
      helpText         : '@?',
      enableNull       : '<?',
    },
  });

CostCenterSelectController.$inject = ['CostCenterService', 'NotifyService', '$translate'];

/**
 * @param CostCenters
 * @param Notify
 * @param $translate
 * @function CostCenterSelectionController
 * @description
 * CostCenter selection component
 */
function CostCenterSelectController(CostCenters, Notify, $translate) {
  const $ctrl = this;

  /**
   *
   */
  function loadCostCenters() {
    CostCenters.read()
      .then(costCenters => {
        $ctrl.costCenters = $ctrl.filter
          ? costCenters.filter(item => ($ctrl.principal ? item.is_principal : !item.is_principal))
          : costCenters;

        if ($ctrl.enableNull) {
          const nullCC = {
            id : -1,
            label : $translate.instant('COST_CENTER.NO_COST_CENTER_DEFINED'),
          };
          $ctrl.costCenters = [nullCC].concat($ctrl.costCenters);
        }
      })
      .catch(Notify.handleError);
  }

  $ctrl.$onInit = () => {
    $ctrl.required = !!($ctrl.required);
    $ctrl.label = $ctrl.label || $ctrl.required ? 'FORM.LABELS.COST_CENTER' : 'FORM.LABELS.COST_CENTER_OPTIONAL';
    $ctrl.costCenterId = $ctrl.costCenterId ? +$ctrl.costCenterId : null;
    loadCostCenters();
  };

  $ctrl.$onChanges = (changes) => {
    if (changes.costCenterId && changes.costCenterId.currentValue) {
      loadCostCenters();
    }
  };

  $ctrl.onSelect = costCenter => {
    $ctrl.onSelectCallback({ costCenter });
  };
}
