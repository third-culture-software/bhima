angular.module('bhima.controllers')
  .controller('CreateUpdateRoomController', CreateUpdateRoomController);

CreateUpdateRoomController.$inject = [
  'uuid', 'RoomService', 'NotifyService', '$uibModalInstance',
];

/**
 *
 * @param uuid
 * @param Room
 * @param Notify
 * @param Instance
 */
function CreateUpdateRoomController(uuid, Room, Notify, Instance) {
  const vm = this;
  vm.close = close;

  vm.room = {};
  vm.submit = submit;
  vm.isCreating = !uuid;
  vm.onSelectWard = onSelectWard;

  vm.onInputTextChange = (key, value) => {
    vm.room[key] = value;
  };

  init();

  /**
   *
   */
  function init() {
    if (!vm.isCreating) {
      Room.read(uuid)
        .then(room => {
          vm.room = room;
        })
        .catch(Notify.handleError);
    }
  }

  /**
   *
   * @param ward
   */
  function onSelectWard(ward) {
    vm.room.ward_uuid = ward.uuid;
  }

  // create or update a Room
  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.HAS_ERRORS');
      return false;
    }

    delete vm.room.ward_name;
    delete vm.room.service_name;
    const operation = vm.isCreating ? Room.create(vm.room) : Room.update(uuid, vm.room);

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
