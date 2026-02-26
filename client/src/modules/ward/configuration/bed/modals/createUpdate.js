angular.module('bhima.controllers')
  .controller('CreateUpdateBedController', CreateUpdateBedController);

CreateUpdateBedController.$inject = [
  'uuid', 'BedService', 'NotifyService', '$uibModalInstance',
];

/**
 *
 * @param uuid
 * @param Bed
 * @param Notify
 * @param Instance
 */
function CreateUpdateBedController(uuid, Bed, Notify, Instance) {
  const vm = this;
  vm.close = close;

  vm.bed = {};
  vm.submit = submit;
  vm.isCreating = !uuid;
  vm.onSelectWard = onSelectWard;
  vm.onSelectRoom = onSelectRoom;

  vm.onInputTextChange = (key, value) => {
    vm.bed[key] = value;
  };

  init();

  /**
   *
   */
  function init() {
    if (!vm.isCreating) {
      Bed.read(uuid)
        .then(bed => {
          vm.bed = bed;
          vm.ward_uuid = bed.ward_uuid;
        })
        .catch(Notify.handleError);
    }
  }

  /**
   *
   * @param ward
   */
  function onSelectWard(ward) {
    vm.ward_uuid = ward.uuid;
  }

  /**
   *
   * @param room
   */
  function onSelectRoom(room) {
    vm.bed.room_uuid = room.uuid;
  }

  // create or update a Bed
  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.HAS_ERRORS');
      return false;
    }

    delete vm.bed.ward_name;
    delete vm.bed.ward_uuid;
    delete vm.bed.room_label;
    delete vm.bed.service_name;
    delete vm.bed.description;
    const operation = vm.isCreating ? Bed.create(vm.bed) : Bed.update(uuid, vm.bed);

    return operation
      .then(() => {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
        return Instance.close(true);
      })
      .catch(Notify.handleError);
  }

  // just close the modal
  /**
   *
   */
  function close() {
    return Instance.close();
  }

}
