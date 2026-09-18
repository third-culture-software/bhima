angular.module('bhima.components')
  .component('bhEntityTypeahead', {
    templateUrl : 'modules/templates/bhEntityTypeahead.html',
    controller  : bhEntityTypeaheadController,
    bindings    : {
      entityUuid       : '<?',
      onSelectCallback : '&',
      disabled         : '<?',
    },
  });

bhEntityTypeaheadController.$inject = [
  'FindEntityService', 'NotifyService', '$q',
];

/**
 *
 * @param FindEntities
 * @param Notify
 * @param $q
 */
function bhEntityTypeaheadController(FindEntities, Notify, $q) {
  const $ctrl = this;
  const MIN_SEARCH_LENGTH = 4;
  const SEARCH_LIMIT = 10;

  let timer = $q.defer();
  let latestRequestId = 0; 

  $ctrl.$onChanges = (changes) => {
    if (!changes.entityUuid) { return; }

    const uuid = changes.entityUuid.currentValue;
    if (uuid) {
      fetchEntityByUuid(uuid);
    } else {
      $ctrl.entity = null;
    }
  };

  $ctrl.$onDestroy = () => {
    cancelInProgressRequests();
  };

  /**
   *
   * @param uuid
   */
  function fetchEntityByUuid(uuid) {
    const requestId = ++latestRequestId;

    FindEntities.read(uuid)
      .then(entity => {
        // ignore stale responses if a newer request has been made since
        if (requestId === latestRequestId) {
          $ctrl.entity = entity;
        }
      })
      .catch(Notify.handleError);
  }

  $ctrl.isValid = () => angular.isObject($ctrl.entity);

  $ctrl.lookupEntities = (text) => {
    cancelInProgressRequests();

    if (!text || text.length < MIN_SEARCH_LENGTH) { return null; }

    return FindEntities.read(null, { text, limit : SEARCH_LIMIT }, { timeout : timer.promise });
  };

  /**
   *
   */
  function cancelInProgressRequests() {
    timer.resolve();
    timer = $q.defer();
  }

  $ctrl.onSelectEntity = (entity) => {
    $ctrl.onSelectCallback({ entity });
  };
}
