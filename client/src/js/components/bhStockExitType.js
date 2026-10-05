const stockExitTypeTmpl = `
<div class="col-md-3 col-xs-6" ng-repeat="type in $ctrl.types track by type.id">
  <button
    type="button"
    id="entry-exit-type-{{::type.id}}"
    class="btn-block panel panel-default segment ima-stat-card"
    ng-class="{ 'ima-stat-card-reversed' : $ctrl.isTypeSelected(type) }"
    ng-click="$ctrl.selectExitType(type)">
      <div class="panel-body text-center text-ellipsis">
        <div class="ui lg statistic">
          <div class="value" translate>{{type.labelKey}}</div>
          <div class="ui-hidable-label" ng-hide="$ctrl.isTypeSelected(type)" translate>{{type.descriptionKey}}</div>
          <div class="ui-hidable-label" ng-show="$ctrl.isTypeSelected(type)" translate>{{$ctrl.selectedTypeLabel}}</div>
        </div>
      </div>
  </button>
</div>

<div class="col-xs-12" ng-if="$ctrl.depotUuid && $ctrl.types.length === 0">
  <p class="alert alert-danger">
    <i class="fa fa-warning"></i>
    <span translate translate-values="$ctrl.depot">STOCK.NO_EXIT_TYPES</span>
  </p>
</div>
`;

angular.module('bhima.components')
  .component('bhStockExitType', {
    template : stockExitTypeTmpl,
    controller : StockExitTypeController,
    bindings : {
      depotUuid : '<',
      exitTypeId : '<?',
      onSelectCallback : '&',
    },
  });

StockExitTypeController.$inject = ['StockEntryExitTypeService', 'DepotService', 'NotifyService'];

/**
 * Stock Entry Exit Type component
 * @param Types
 * @param Depots
 * @param Notify
 */
function StockExitTypeController(Types, Depots, Notify) {
  const $ctrl = this;
  const local = { };

  // use exit types for this controller
  const types = Types.options.filter(type => type.page === 'exit');

  $ctrl.$onChanges = (changes) => {
    if (changes.depotUuid) {
      Depots.read(changes.depotUuid.currentValue)
        .then(result => { 
          local.depot = result;
          $ctrl.types = Depots.getExitCapabilities(result, types);
          resetExitTypes();
        })
        .catch(Notify.handleError);
    }

    // when the exit type is cleared, reset exit types
    if (changes.exitTypeId?.currentValue === undefined) {
      resetExitTypes();
    } else if (changes.exitTypeId?.currentValue !== undefined && $ctrl.selectedExitType?.id !== changes.exitTypeId?.currentValue) {
      const type = Types.getTypeById(changes.exitTypeId.currentValue);
      $ctrl.selectExitType(type, false);
    }
  };

  /**
   * @param type
   * @param shouldTriggerCallback
   * @function selectExitType
   * @description
   * This function uses the callback specified by the exit types to load
   * the entity information, pick up the formatting for the label, then pass
   * everything back to the stock exit controller.  This way, the view/display
   * logic is contained here, but the functional logic is kept in the stock exit
   * controller.
   */
  $ctrl.selectExitType = (type, shouldTriggerCallback = true) => {
    // this prevents us from passing the entity if is it unnecessary up a patient uuid in the service route
    const shouldLookupEntity = angular.equals(type.id, $ctrl.selectedExitType?.id);
    const entityUuid = shouldLookupEntity && local.entity?.uuid;

    $ctrl.selectedExitType = type;
    $ctrl.selectedTypeLabel = type.descriptionKey;

    return type.openSelectionModal(local.depot, entityUuid)
      .then(result => {
        if (!result ) { return resetExitTypes(); }

        local.entity = result;
        $ctrl.selectedTypeLabel = type.formatLabel(result);

        if (shouldTriggerCallback) {
          return $ctrl.onSelectCallback({ type, entity : result });
        }
      })
      .catch(Notify.handleError);
  };

  /**
   * @param type
   * @function isTypeSelected
   * @description
   * Checks to see if the type is selected
   */
  $ctrl.isTypeSelected = (type) => {
    return angular.equals(type.id, $ctrl.selectedExitType?.id);
  };

  /**
   * @function resetExitTypes
   * @description
   * Clears the previously selected types.
   */
  function resetExitTypes() {
    $ctrl.selectedExitType = {};
    $ctrl.selectedTypeLabel = '';
    delete local.entity;
  }
}
