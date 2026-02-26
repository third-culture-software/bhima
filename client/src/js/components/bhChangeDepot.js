angular.module('bhima.directives')
  .component('bhChangeDepot', {
    template : `
    <a href="" ng-click="$ctrl.changeDepot()" data-action="change-depot">
      <i class="fa fa-archive"></i> <span translate>DEPOT.CHANGE</span>
    </a>`,
    controller : bhChangeDepotController,
    bindings    : {
      onSelect : '&',
      skipInitialLoad : '<?',
    },
  });

bhChangeDepotController.$inject = [
  'DepotService', 'appcache', 'NotifyService',
];

/**
 *
 * @param Depots
 * @param AppCache
 * @param Notify
 */
function bhChangeDepotController(Depots, AppCache, Notify) {
  const $ctrl = this;

  const cache = new AppCache('StockCache');

  $ctrl.$onInit = () => {

    if ($ctrl?.skipInitialLoad) {
      return;
    }

    if (cache.depotUuid) {
      loadDepot(cache.depotUuid);
    } else {
      changeDepot();
    }
  };

  let currentDepot;

  /**
   *
   * @param uuid
   */
  function loadDepot(uuid) {
    Depots.read(uuid, { only_user : true })
      .then(depot => {
        currentDepot = depot;
        $ctrl.onSelect({ depot });
      })
      .catch(handleError);
  }

  $ctrl.changeDepot = changeDepot;

  /**
   *
   */
  function changeDepot() {
    // if requirement is true the modal will use History.back() to
    // cancel the modal.
    const requirement = !cache.depotUuid;

    return Depots.openSelectionModal(currentDepot, requirement)
      .then(depot => {
        cache.depotUuid = depot.uuid;
        currentDepot = depot;
        $ctrl.onSelect({ depot });
      });
  }

  /**
   *
   * @param err
   */
  function handleError(err) {
    if (err.status !== 404) { return Notify.handleError(err); }

    delete cache.depotUuid;

    return changeDepot();
  }
}
