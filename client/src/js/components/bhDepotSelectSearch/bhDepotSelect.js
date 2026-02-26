angular.module('bhima.components')
  .component('bhDepotSearchSelect', {
    templateUrl : 'js/components/bhDepotSelectSearch/bhDepotSelectSearch.html',
    controller  : DepotSearchSelectController,
    bindings    : {
      depotsUuids     : '<?',
      required        : '<?',
      label           : '@?',
      id              : '@?',
      onChange        : '&',
    },
  });

DepotSearchSelectController.$inject = [
  'DepotService', 'uuid',
];

/**
 * Multiple Depot Selection Component
 * @param Depots
 */
function DepotSearchSelectController(Depots) {
  const $ctrl = this;

  $ctrl.$onInit = () => {
  // label to display
    $ctrl.label = $ctrl.label || 'STOCK.DEPOT';
    //
    $ctrl.depotsSelected = $ctrl.depotsSelected || [];
    // init the model
    $ctrl.depotsUuids = $ctrl.depotsUuids || [];

  };

  $ctrl.$onChanges = () => {
    loadSelected($ctrl.depotsUuids);
  };

  // get depots by text
  $ctrl.loadDepots = (text) => {
    return Depots.read(null, {
      limit : 10,
      text,
    }).then(depots => {
      const selectedUuids = $ctrl.depotsSelected.map(d => d.uuid);
      return depots.filter(d => !selectedUuids.includes(d.uuid));
    });
  };

  // on select a depot from the typehead
  $ctrl.onSelect = (item) => {
    $ctrl.depotsSelected.push(angular.copy(item));
    $ctrl.handleChange();
  };

  // fires the onChange bound to the component boundary
  $ctrl.handleChange = () => {
    const depots = $ctrl.depotsSelected.map(d => d.uuid);
    $ctrl.onChange({ depots });
  };

  // remove a selected depot
  $ctrl.remove = (uuid) => {
    $ctrl.depotsSelected = $ctrl.depotsSelected.filter(depot => depot.uuid !== uuid);
    $ctrl.handleChange();
  };

  /**
   *
   * @param depotsUuids
   */
  function loadSelected(depotsUuids) {
    if (!depotsUuids || !(depotsUuids.length > 0)) return;

    Depots.read(null, { uuids : depotsUuids })
      .then(depots => {
        $ctrl.depotsSelected = depots;
      });
  }
}
