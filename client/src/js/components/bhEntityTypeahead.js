angular.module('bhima.components')
  .component('bhEntityTypeahead', {
    templateUrl : 'modules/templates/bhEntityTypeahead.html',
    controller  : bhEntityTypeaheadController,
    bindings    : {
      entityUuid : '<?',
      onSelectCallback : '&',
      disabled : '<?',
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
  let timer = $q.defer();

  $ctrl.$onInit = () => {
    if ($ctrl.entityUuid) {
      fetchEntityByUuid($ctrl.entityUuid);
    }
  };

  /**
   *
   * @param uuid
   */
  function fetchEntityByUuid(uuid) {
    FindEntities.read(uuid)
      .then(entity => { $ctrl.entity = entity; })
      .catch(Notify.handleError);
  }

  $ctrl.$onChanges = changes => {
    const entityUuid = changes.entityUuid && changes.entityUuid.currentValue;
    if (entityUuid) {
      fetchEntityByUuid(entityUuid);
    }
  };

  $ctrl.isValid = () => {
    return angular.isObject($ctrl.entity);
  };

  $ctrl.lookupEntities = (text) => {
    cancelInProgressRequests();
    if (text.length < 3) { return null; }
    return FindEntities.read(null, { text, limit : 10 }, { timeout : timer.promise });
  };

  // cancels all pending requests
  /**
   *
   */
  function cancelInProgressRequests() {
    timer.resolve();
    timer = $q.defer();
  }

  $ctrl.onSelectEntity = entity => {
    $ctrl.onSelectCallback({ entity });
  };
}
