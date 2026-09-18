angular.module('bhima.components')
  .component('bhRecordTypeahead', {
    templateUrl : 'modules/templates/bhRecordTypeahead.html',
    controller  : bhRecordTypeaheadController,
    bindings    : {
      recordUuid       : '<?',
      onSelectCallback : '&',
      disabled         : '<?',
    },
  });

bhRecordTypeaheadController.$inject = [
  'FindReferenceService', 'NotifyService', '$q',
];

/**
 *
 * @param FindReferences
 * @param Notify
 * @param $q
 */
function bhRecordTypeaheadController(FindReferences, Notify, $q) {
  const $ctrl = this;
  const MIN_SEARCH_LENGTH = 4;
  const SEARCH_LIMIT = 3;

  let timer = $q.defer();
  let latestRequestId = 0;

  $ctrl.$onChanges = (changes) => {
    if (!changes.recordUuid) { return; }

    const uuid = changes.recordUuid.currentValue;
    if (uuid) {
      fetchRecordByUuid(uuid);
    } else {
      $ctrl.record = null;
    }
  };

  $ctrl.$onDestroy = () => {
    cancelInProgressRequests();
  };

  /**
   *
   * @param uuid
   */
  function fetchRecordByUuid(uuid) {
    const requestId = ++latestRequestId;

    FindReferences.read(uuid)
      .then(record => {
        // ignore stale responses if a newer request has been made since
        if (requestId === latestRequestId) {
          $ctrl.record = record;
        }
      })
      .catch(Notify.handleError);
  }

  $ctrl.isValid = () => angular.isObject($ctrl.record);

  $ctrl.lookupRecords = (text) => {
    cancelInProgressRequests();

    if (!text || text.length < MIN_SEARCH_LENGTH) { return null; }

    return FindReferences.read(null, { text, limit : SEARCH_LIMIT }, { timeout : timer.promise });
  };

  // cancels all pending requests
  /**
   *
   */
  function cancelInProgressRequests() {
    timer.resolve();
    timer = $q.defer();
  }

  $ctrl.onSelectRecord = (record) => {
    $ctrl.onSelectCallback({ record });
  };
}
