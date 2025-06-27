angular.module('bhima.controllers')
  .controller('PatientGroupController', PatientGroupController);

PatientGroupController.$inject = [
  'PatientGroupService', 'PriceListService', 'SessionService',
  'ModalService', 'util', 'NotifyService', 'SubsidyService',
  'InvoicingFeesService', '$uibModal', 'uiGridConstants',
];

/**
 *  Patient Group Controller
 *
 *  This controller creates and updates patient groups in the application.  A
 *  Patient Group is a medical classification for patients with common
 *  properties.  For example, HIV patients, pregnant women, children under five.
 *
 *  A patient group might have an associated price list, to allow groups of
 *  patients to have different price lists due to their medical state.
 *
 *  @constructor
 */
function PatientGroupController(
  PatientGroups, PriceLists, Session, ModalService, util, Notify, Subsidies,
  InvoicingFees, $uibModal, uiGridConstants,
) {
  const vm = this;

  // by default, set loading to false.
  vm.loading = false;

  // This method is responsible of initializing data
  function startup() {
    loadPatientGroups();
  }

  vm.createUpdateGroupModal = (selectedGroup = {}) => {
    return $uibModal.open({
      templateUrl : 'modules/patients/groups/modal/createUpdate.html',
      controller : 'GroupCreateUpdateContoller as ModalCtrl',
      resolve : { data : () => selectedGroup },
    }).result.then(res => {

      if (res) {
        loadPatientGroups();
      }
    });
  };

  const columns = [{
    field : 'name',
    displayName : 'FORM.LABELS.NAME',
    headerCellFilter : 'translate',
  },
  {
    field : 'priceListLabel',
    displayName : ' TABLE.COLUMNS.PRICE_LIST',
    headerCellFilter : 'translate',
  },
  {
    field : 'patientNumber',
    displayName : 'FORM.INFO.PATIENTS',
    headerCellFilter : 'translate',
    cellClass : 'text-right',
  },
  {
    field : 'actions',
    enableFiltering : false,
    width : 100,
    displayName : '',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/patients/groups/templates/action.cell.html',
  }];

  // ng-click="
  vm.gridOptions = {
    appScopeProvider : vm,
    enableColumnMenus : false,
    columnDefs : columns,
    enableSorting : true,
    fastWatch : true,
    flatEntityAccess : true,
    onRegisterApi : (gridApi) => {
      vm.gridApi = gridApi;
    },
  };
  // this function is responsible of removing a patient group
  function remove(uuid) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then((bool) => {
        // if the user cancels, return immediately.
        if (!bool) { return; }

        PatientGroups.delete(uuid)
          .then(() => {
            Notify.success('FORM.INFO.OPERATION_SUCCESS');
            loadPatientGroups();
          })
          .catch(Notify.handleError);
      });
  }

  // this method is load the list of patient group
  function loadPatientGroups() {
    return PatientGroups.read(null, { detailed : 1 })
      .then(groups => {
        vm.gridOptions.data = groups;
      }).catch(Notify.handleError);
  }

  /**
   * @function toggleInlineFilter
   *
   * @description
   * Switches the inline filter on and off.
   */
  vm.toggleInlineFilter = function toggleInlineFilter() {
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  };

  startup();

  // exposing interfaces to the view
  vm.remove = remove;
}
