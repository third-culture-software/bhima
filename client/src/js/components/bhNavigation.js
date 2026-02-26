angular.module('bhima.components')
  .component('bhNavigation', {
    controller : NavigationController,
    templateUrl : 'modules/templates/navigation.tmpl.html',
  });

NavigationController.$inject = [
  '$location', '$rootScope', 'Tree', 'AppCache', 'NotifyService', '$transitions', '$state',
];

/**
 * Navigation Controller
 * @param $location
 * @param $rootScope
 * @param Tree
 * @param AppCache
 * @param Notify
 * @param $transitions
 * @param $state
 * @description
 * This controller determines the
 */
function NavigationController($location, $rootScope, Tree, AppCache, Notify, $transitions, $state) {
  const $ctrl = this;
  const openedCache = AppCache('navigation.opened');

  const $$listeners = [];

  /*
   * Object used to index unit ids and paths, this allows for very efficient
   * lookups during runtime and means that the units only have to be recursively
   * parsed once - every following method should use the index to point to the
   * relevant unit
   */
  const unitsIndex = { id : {}, path : {} };

  /**
   *
   */
  function loadTreeUnits() {
    Tree.units()
      .then(units => {
        Tree.sortByTranslationKey(units);

        $ctrl.units = units;

        calculateUnitIndex($ctrl.units);
        expandInitialUnits($ctrl.units);

        const currentStateName = $state.$current.name;
        const currentStateUrl = $state.href(currentStateName);
        updateSelectionOnPathChange(currentStateUrl);
      })
      .catch(Notify.handleError);
  }

  // Tree Utility methods
  $ctrl.toggleUnit = function toggleUnit(unit) {
    unit.open = unit.open || false;
    unit.open = !unit.open;

    // Update cached record of modules expansion
    openedCache[unit.id] = unit.open;
  };

  $ctrl.navigate = function navigate(unit) {
    selectUnit(unit);
    $location.path(unit.path);
  };

  $ctrl.refreshTranslation = function refreshTranslation() {
    Tree.sortByTranslationKey($ctrl.units);
  };

  $ctrl.isParentNode = function isParentNode(node) {
    return node.children && node.children.length > 0;
  };

  $ctrl.isChildNode = function isChildNode(node) {
    return node.children && node.children.length === 0;
  };

  $ctrl.isOpen = function isOpen(node) {
    return $ctrl.isParentNode(node) && node.open;
  };

  /**
   * Select a unit in the tree given a specified URL.
   * @param nextUrl
   */
  function updateSelectionOnPathChange(nextUrl) {
    /**
     * loop through all paths, selecting those are match the selected url
     * @todo - write test cases to be sure this works in all cases, probably
     * dependent on the ordering of unitsIndex.
     */
    const paths = Object.keys(unitsIndex.path);
    paths.sort();

    paths.forEach(key => {
      const node = unitsIndex.path[key];
      if (nextUrl && nextUrl.includes(node.path)) {
        selectUnit(node);
      }
    });
  }

  /**
   *
   * @param unit
   */
  function selectUnit(unit) {
    // Clear previous selection if it exists
    if ($ctrl.selectedUnit) {
      $ctrl.selectedUnit.selected = false;
    }

    const parentNode = unitsIndex.id[unit.parent];

    // Update status of currently selected unit
    unit.selected = true;
    $ctrl.selectedUnit = unit;

    // make sure the parent node is open
    parentNode.open = true;
  }

  /**
   * Set the open state on units that are registered as open in the app cache
   * @todo - This method may make more sense as part of the Tree service
   */
  function expandInitialUnits() {
    const nodes = Object.keys(openedCache);

    nodes.forEach(key => {
      const isOpen = openedCache[key];

      // Lookup the cached unit key in the current set of units
      const currentUnit = unitsIndex.id[key];

      if (angular.isDefined(currentUnit)) {

        // Unit exists - set the relevant open state
        currentUnit.open = isOpen;
      } else {

        // Unit does not exist - potentially the permission has been revoked
        // Update the cache to reflect this
        delete openedCache[key];
      }
    });
  }

  /**
   * Recursively calculate unit indexes (only one recursive parse of each tree
   * should be required
   * @param units
   */
  function calculateUnitIndex(units) {
    units.forEach(unit => {
      unitsIndex.id[unit.id] = unit;
      unitsIndex.path[unit.path] = unit;

      // See if it is a settings page and needs a "gear" icon
      unit.isSettings = unit.name.indexOf('[SETTINGS]') >= 0;

      calculateUnitIndex(unit.children);
    });
  }

  /**
   * Track changes to translation and sort units accordingly
   * '$translateChangeSuccess' event will fire when then translation key has
   * changed within BHIMA - tracking this allows the tree to update without the
   * page being refreshed
   */
  $$listeners.push($rootScope.$on('$translateChangeSuccess', $ctrl.refreshTranslation));

  // if the session is reloaded, download the new tree units
  $$listeners.push($rootScope.$on('session:reload', loadTreeUnits));

  // unregister listeners on destroy
  $ctrl.$onDestroy = function $onDestroy() {
    $$listeners.forEach(unregister => unregister());
  };

  // update the selected unit when $state is changed
  $transitions.onSuccess({}, transition => {
    const nextState = transition.to();
    const nextUrl = $state.href(nextState.name);
    updateSelectionOnPathChange(nextUrl);
  });

  $ctrl.$onInit = () => loadTreeUnits();
}
