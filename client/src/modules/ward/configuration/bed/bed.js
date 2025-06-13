angular.module('bhima.controllers')
  .controller('BedController', BedController);

BedController.$inject = [
  'BedService', '$uibModal', 'ModalService',
  'NotifyService', 'uiGridConstants', 'SessionService',
  '$rootScope',
];

function BedController(Bed, Modal, ModalService, Notify, uiGridConstants, Session, $rootScope) {
  const vm = this;
  const { enterprise } = Session;

  // global variables
  vm.gridApi = {};
  vm.filterEnabled = false;
  vm.toggleFilter = toggleFilter;
  vm.createBed = createBed;
  vm.deleteBed = deleteBed;
  vm.expandAll = () => vm.gridApi.treeBase.expandAllRows();

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider  : vm,
    enableColumnMenus : false,
    fastWatch         : true,
    flatEntityAccess  : true,
    enableSorting     : true,
    treeRowHeaderAlwaysVisible : false,
    onRegisterApi     : onRegisterApiFn,
    columnDefs : [
      {
        field : 'label',
        displayName : 'BED.TITLE',
        headerCellFilter : 'translate',
        cellTemplate : '/modules/ward/configuration/bed/templates/bed.tmpl.html',
      },
      {
        field : 'room_label',
        displayName : 'ROOM.TITLE',
        headerCellFilter : 'translate',
        grouping : { groupPriority : 1 },
      },
      {
        field : 'ward_name',
        displayName : 'WARD.TITLE',
        headerCellFilter : 'translate',
        grouping : { groupPriority : 0 },
      },
      {
        field : 'action',
        width : 80,
        displayName : '',
        cellTemplate : '/modules/ward/configuration/bed/templates/action.tmpl.html',
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
  function loadBeds() {
    vm.loading = true;
    Bed.read(null, { enterprise_id : enterprise.id })
      .then(Beds => {
        vm.gridOptions.data = Beds;
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

  function createBed(uuid) {
    Modal.open({
      templateUrl : 'modules/ward/configuration/bed/modals/createUpdate.html',
      controller :  'CreateUpdateBedController as ModalCtrl',
      backdrop : 'static',
      resolve : { uuid : () => uuid },
    }).result.then(result => {
      if (result) {
        $rootScope.$broadcast('ward-configuration-changes');
      }
    });
  }

  // switch to delete warning mode
  function deleteBed(uuid) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(bool => {
        if (!bool) { return; }

        Bed.delete(uuid)
          .then(() => {
            Notify.success('FORM.INFO.OPERATION_SUCCESS');
            $rootScope.$broadcast('ward-configuration-changes');
          })
          .catch(Notify.handleError);
      });
  }

  // listen ward configuration changes
  $rootScope.$on('ward-configuration-changes', loadBeds);

  loadBeds();
}
