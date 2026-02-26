angular.module('bhima.controllers')
  .controller('SelectDepotModalController', SelectDepotModalController);

SelectDepotModalController.$inject = [
  '$uibModalInstance', 'DepotService', 'NotifyService',
  'depot', '$window',
];

/**
 * This modal selects a depot from the list of all depots.
 * @param Instance
 * @param Depots
 * @param Notify
 * @param depot
 * @param $window
 */
function SelectDepotModalController(Instance, Depots, Notify, depot, $window) {
  const vm = this;
  const LIMIT = 10;

  // bind the depot passed into the controller
  vm.depot = depot;
  vm.selectDepot = selectDepot;
  vm.hasSelectedDepot = hasSelectedDepot;

  vm.isDepotRequired = Depots.isDepotRequired;
  vm.allowClearing = Depots.allowClearing;

  vm.loading = false;
  vm.limit = LIMIT;
  vm.showAllDepots = showAllDepots;

  // this is a toggle for a one-time message shown to the user if they do not have a cached depot.
  vm.hasNoDefaultDepot = !angular.isDefined(depot);

  vm.submit = function submit() {
    return Instance.close(vm.depot);
  };

  vm.clearDepot = () => {
    vm.depot = null;
  };

  // the cancel button has two behaviors, depending on if we have a cached depot or not.
  // If we do not have a cached depot and we didn't pass a depot in, we use history.back()
  // to navigate back to wherever the user came from.  Otherwise, we simply close the modal.
  vm.cancel = () => {
    if (vm.hasNoDefaultDepot && vm.isDepotRequired) {
      $window.history.back();
    }

    Instance.dismiss();
  };

  // loads a new set of depots from the server.
  /**
   *
   */
  function startup() {
    toggleLoadingIndicator();
    // download only the depots that the user has the management right
    Depots.read(null, { only_user : true })
      .then((depots) => {
        vm.depots = depots;
        vm.displayLimit = LIMIT;
        vm.totalOtherDepots = vm.depots.length - LIMIT;
      })
      .catch(Notify.handleError)
      .finally(toggleLoadingIndicator);
  }

  /**
   *
   */
  function showAllDepots() {
    vm.displayLimit = vm.depots.length;
    vm.totalOtherDepots = 0;
    vm.showAll = true;
  }

  // fired when a user selects a depot from a list
  /**
   *
   * @param depotUuid
   */
  function selectDepot(depotUuid) {
    vm.depot = vm.depots
      .filter(({ uuid }) => uuid === depotUuid)
      .pop();
  }

  /**
   *
   */
  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  /**
   *
   */
  function hasSelectedDepot() {
    return vm.depot && vm.depot.uuid;
  }

  // start up the module
  startup();
}
