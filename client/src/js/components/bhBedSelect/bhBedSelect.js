angular.module('bhima.components')
  .component('bhBedSelect', {
    templateUrl : 'js/components/bhBedSelect/bhBedSelect.html',
    controller  : BedSelectController,
    transclude  : true,
    bindings    : {
      uuid      : '<',
      roomUuid : '<',
      onSelectCallback : '&',
      required : '<?',
      label    : '@?',
      autoSelect : '<?',
      showOccupiedBeds : '<?',
    },
  });

BedSelectController.$inject = ['BedService', 'NotifyService'];

/**
 * Bed selection component
 * @param Bed
 * @param Notify
 */
function BedSelectController(Bed, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.label = $ctrl.label || 'BED.TITLE';
    $ctrl.disabled = !$ctrl.roomUuid;
    loadBeds();
  };

  $ctrl.$onChanges = (changes) => {
    if (changes.roomUuid && changes.roomUuid.currentValue) {
      $ctrl.disabled = !changes.roomUuid.currentValue;
      const roomUuid = changes.roomUuid.currentValue || 'x';
      loadBeds(roomUuid);
    }

    if (changes.autoSelect && $ctrl.roomUuid) {
      $ctrl.disabled = false;
      loadBeds();
    }
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = $item => {
    $ctrl.onSelectCallback({ bed : $item });
  };

  /**
   *
   * @param roomUuid
   */
  function loadBeds(roomUuid) {
    const params = loadParams();
    params.room_uuid = roomUuid || params.room_uuid;
    Bed.read(null, params)
      .then(beds => {
        $ctrl.beds = beds;

        if ($ctrl.autoSelect && beds.length > 0) {
          [$ctrl.bed] = beds;
          $ctrl.bed.hrLabel = $ctrl.bed.ward_name.concat('/', $ctrl.bed.room_label, '/', $ctrl.bed.label);
          $ctrl.id = $ctrl.bed.id;
          $ctrl.onSelectCallback({ bed : $ctrl.id });
        }

        $ctrl.noBedAvailable = !!(beds.length === 0);
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function loadParams() {
    // load only beds for a given room
    const allBeds = { room_uuid : $ctrl.roomUuid || 'x' };
    const occupiedBeds = { room_uuid : $ctrl.roomUuid || 'x', is_occupied : 1 };
    const notOccupiedBeds = { room_uuid : $ctrl.roomUuid || 'x', is_occupied : 0 };

     
    return $ctrl.showOccupiedBeds === true ? occupiedBeds
      : $ctrl.showOccupiedBeds === false ? notOccupiedBeds
        : allBeds;
  }
}
