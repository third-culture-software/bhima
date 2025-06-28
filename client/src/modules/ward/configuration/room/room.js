angular.module('bhima.controllers')
  .controller('RoomController', RoomController);

RoomController.$inject = [
  'RoomService', '$uibModal', 'ModalService',
  'NotifyService', 'uiGridConstants', 'SessionService',
  '$rootScope',
];

function RoomController(Room, Modal, ModalService, Notify, uiGridConstants, Session, $rootScope) {
  const vm = this;
  const { enterprise } = Session;
  // global variables
  vm.gridApi = {};
  vm.filterEnabled = false;
  vm.toggleFilter = toggleFilter;
  vm.createRoom = createRoom;
  vm.deleteRoom = deleteRoom;

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider  : vm,
    enableColumnMenus : false,
    fastWatch         : true,
    flatEntityAccess  : true,
    enableSorting     : true,
    onRegisterApi     : onRegisterApiFn,
    columnDefs : [
      {
        field : 'label',
        displayName : 'ROOM.TITLE',
        headerCellFilter : 'translate',
      },
      {
        field : 'nb_beds',
        displayName : 'BED.NB_BEDS',
        headerCellFilter : 'translate',
        type : 'number',
      },
      {
        field : 'ward_name',
        displayName : 'WARD.TITLE',
        headerCellFilter : 'translate',
      },
      {
        field : 'action',
        width : 80,
        displayName : '',
        cellTemplate : '/modules/ward/configuration/room/templates/action.tmpl.html',
        enableSorting : false,
        enableFiltering : false,
      },
    ],
  };

  function onRegisterApiFn(gridApi) {
    vm.gridApi = gridApi;
  }

  function toggleFilter() {
    vm.filterEnabled = !vm.filterEnabled;
    vm.gridOptions.enableFiltering = vm.filterEnabled;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  // get all enterprise's depatments
  function loadRooms() {
    vm.loading = true;
    Room.read(null, { enterprise_id : enterprise.id })
      .then(Rooms => {
        vm.gridOptions.data = Rooms;
      })
      .catch(handleError)
      .finally(toggleLoading);
  }

  function toggleLoading() {
    vm.loading = !vm.loading;
  }

  function handleError(err) {
    vm.hasError = true;
    Notify.handleError(err);
  }

  function openCreateUpdateModal(uuid) {
    return Modal.open({
      templateUrl : 'modules/ward/configuration/room/modals/createUpdate.html',
      controller :  'CreateUpdateRoomController as ModalCtrl',
      backdrop : 'static',
      resolve : {
        uuid : () => uuid,
      },
    }).result;
  }

  function createRoom(uuid) {
    openCreateUpdateModal(uuid).then(result => {
      if (result) {
        $rootScope.$broadcast('ward-configuration-changes');
      }
    });
  }

  // switch to delete warning mode
  function deleteRoom(uuid) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(bool => {
        if (!bool) { return; }

        Room.delete(uuid)
          .then(() => {
            Notify.success('FORM.INFO.OPERATION_SUCCESS');
            $rootScope.$broadcast('ward-configuration-changes');
          })
          .catch(Notify.handleError);
      });
  }

  // listen ward configuration changes
  $rootScope.$on('ward-configuration-changes', loadRooms);

  loadRooms();
}
