angular.module('bhima.components')
  .component('bhAssetConditionSelect', {
    templateUrl : 'js/components/bhAssetConditionSelect/bhAssetConditionSelect.tmpl.html',
    controller  : AssetConditionSelectController,
    transclude  : true,
    bindings    : {
      conditionId      : '<',
      label            : '@?',
      onSelectCallback : '&',
      required         : '<?',
    },
  });

AssetConditionSelectController.$inject = ['NotifyService', 'bhConstants'];

/**
 * Select asset condition controller
 * @param Notify
 * @param bhConstants
 */
function AssetConditionSelectController(Notify, bhConstants) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.label = $ctrl.label || 'ASSET.ASSET_CONDITION';

    $ctrl.conditions = bhConstants.assetCondition;
  };

  $ctrl.onSelect = cond => {
    $ctrl.onSelectCallback({ cond });
  };
}
