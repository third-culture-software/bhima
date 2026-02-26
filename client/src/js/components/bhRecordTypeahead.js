angular.module('bhima.components')
  .component('bhRecordTypeahead', {
    templateUrl : 'modules/templates/bhRecordTypeahead.html',
    controller  : bhRecordTypeaheadController,
    bindings    : {
      recordUuid : '<?',
      onSelectCallback : '&',
      disabled : '<?',
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
  let timer = $q.defer();

  $ctrl.$onInit = () => {
    if ($ctrl.recordUuid) {
      fetchRecordByUuid($ctrl.recordUuid);
    }
  };

  /**
   *
   * @param uuid
   */
  function fetchRecordByUuid(uuid) {
    FindReferences.read(uuid)
      .then(record => { $ctrl.record = record; })
      .catch(Notify.handleError);
  }

  $ctrl.$onChanges = changes => {
    const recordUuid = changes.recordUuid && changes.recordUuid.currentValue;
    if (recordUuid) {
      fetchRecordByUuid(recordUuid);
    }
  };

  $ctrl.isValid = () => {
    return angular.isObject($ctrl.record);
  };

  $ctrl.lookupRecords = (text) => {
    cancelInProgressRequests();
    if (text.length < 3) { return null; }
    return FindReferences.read(null, { text, limit : 3 }, { timeout : timer.promise });
  };

  // cancels all pending requests
  /**
   *
   */
  function cancelInProgressRequests() {
    timer.resolve();
    timer = $q.defer();
  }

  $ctrl.onSelectRecord = record => {
    $ctrl.onSelectCallback({ record });
  };
}
