const stockExitTypeTmpl = `
<div class="col-md-3 col-xs-6" ng-repeat="type in $ctrl.types track by type.label">
  <button
    type="button"
    id="entry-exit-type-{{type.label}}"
    class="btn-block panel panel-default segment ima-stat-card"
    ng-class="{ 'ima-stat-card-reversed' : $ctrl.isTypeSelected(type) }"
    ng-click="$ctrl.selectExitType(type)">
      <div class="panel-body text-center text-ellipsis">
        <div class="ui lg statistic">
          <div class="value" translate>{{type.labelKey}}</div>
          <div class="ui-hidable-label" ng-hide="$ctrl.isTypeSelected(type)" translate>{{type.descriptionKey}}</div>
          <div class="ui-hidable-label" ng-show="$ctrl.isTypeSelected(type)" translate>{{$ctrl.destinationLabel}}</div>
        </div>
      </div>
  </button>
</div>

<div class="col-xs-12" ng-if="$ctrl.hasNoTypesDefined">
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
      onSelectCallback : '&',
      depot : '<?',
      exitType : '<?',
      selectedExitType : '=',
      destinationLabel : '=',
    },
  });

StockExitTypeController.$inject = ['StockEntryExitTypeService', 'NotifyService'];

/**
 * Stock Entry Exit Type component
 * @param TypeService
 * @param Notify
 */
function StockExitTypeController(TypeService, Notify) {
  const $ctrl = this;
  const types = TypeService.exitTypes;

  $ctrl.$onInit = function onInit() {
    reloadExitTypes();
  };

  $ctrl.$onChanges = function onChanges(changes) {
    if (changes.depot) {
      reloadExitTypes();
    }

    // when the exit type is cleared, reload exit types
    if (changes.exitType?.currentValue === undefined) {
      reloadExitTypes();
    }
  };

  /**
   * @param type
   * @function selectExitType
   * @description
   * This function uses the callback specified by the exit types to load
   * the entity information, pick up the formatting for the label, then pass
   * everything back to the stock exit controller.  This way, the view/display
   * logic is contained here, but the functional logic is kept in the stock exit
   * controller.
   */
  $ctrl.selectExitType = (type) => {
    // this prevents us looking up a patient uuid in the service route
    const shouldLookupEntity = angular.equals(type, $ctrl.selectedExitType);

    $ctrl.selectedExitType = type;

    $ctrl.destinationLabel = $ctrl.entity
      ? type.formatLabel($ctrl.entity)
      : type.descriptionKey;

    const entityUuid = shouldLookupEntity && $ctrl.entity?.uuid;

    return type.callback($ctrl.depot, entityUuid)
      .then(entity => {
        if (!entity) {
          $ctrl.selectedExitType = {};
          $ctrl.destinationLabel = type.descriptionKey;
          return null;
        }

        $ctrl.entity = entity;
        $ctrl.destinationLabel = type.formatLabel($ctrl.entity);
        return $ctrl.onSelectCallback({ type, entity });
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
    return angular.equals(type.label, $ctrl.selectedExitType?.label);
  };

  /**
   * @function reloadExitTypes
   * @description
   * Clears the previously selected types.
   */
  function reloadExitTypes() {

    // clear old data
    $ctrl.selectedExitType = {};
    $ctrl.destinationLabel = '';
    delete $ctrl.entity;

    if (!$ctrl.depot) { return; }

    // get the final types by filtering on what is allowed in the depot
    $ctrl.types = types
      .filter(type => $ctrl.depot[type.allowedKey]);

    $ctrl.hasNoTypesDefined = ($ctrl.types.length === 0);
  }
}
