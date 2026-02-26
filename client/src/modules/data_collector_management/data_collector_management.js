angular.module('bhima.controllers')
  .controller('DataCollectorManagementController', DataCollectorManagementController);

DataCollectorManagementController.$inject = [
  '$state', 'DataCollectorManagementService', 'NotifyService', 'uiGridConstants', 'ModalService',
];

/**
 * Data Collector Management Controller
 * This module is responsible for handling the CRUD operation on Data Collector Management
 */

/**
 *
 * @param $state
 * @param DataCollectorManagement
 * @param Notify
 * @param uiGridConstants
 * @param ModalService
 */
function DataCollectorManagementController($state, DataCollectorManagement, Notify, uiGridConstants, ModalService) {
  const vm = this;
  vm.gridApi = {};
  vm.filterEnabled = false;
  vm.toggleFilter = toggleFilter;

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
        width : 300,
        displayName : 'FORM.LABELS.DESIGNATION',
        enableFiltering : 'true',
        headerCellFilter : 'translate',
      },
      {
        field : 'description',
        displayName : 'FORM.LABELS.DETAILS',
        enableFiltering : 'true',
        headerCellFilter : 'translate',
      },
      {
        field : 'version_number',
        displayName : 'FORM.LABELS.VERSION',
        width : 100,
        enableFiltering : 'true',
        headerCellFilter : 'translate',
      },
      {
        field : 'is_related_patient',
        displayName : 'FORM.INFO.IS_RELATED_PATIENT',
        width : 300,
        enableFiltering : 'true',
        headerCellFilter : 'translate',
        cellTemplate : '/modules/data_collector_management/templates/is_related_patient.cell.html',
      },
      {
        field : 'include_patient_data',
        displayName : 'FORM.INFO.INCLUDE_PATIENT_DATA',
        width : 300,
        enableFiltering : 'true',
        headerCellFilter : 'translate',
        cellTemplate : '/modules/data_collector_management/templates/include_patient_data.cell.html',
      },
      {
        field : 'color',
        displayName : '',
        width : 100,
        enableFiltering : 'true',
        headerCellFilter : 'translate',
        cellTemplate : '/modules/data_collector_management/templates/color.cell.html',
      },
      {
        field : 'action',
        displayName : '',
        width : 100,
        enableFiltering : 'false',
        cellTemplate : '/modules/data_collector_management/templates/action.cell.html',
      },
    ],
  };
  /**
   *
   * @param gridApi
   */
  function onRegisterApiFn(gridApi) {
    vm.gridApi = gridApi;
  }

  /**
   *
   */
  function toggleFilter() {
    vm.filterEnabled = !vm.filterEnabled;
    vm.gridOptions.enableFiltering = vm.filterEnabled;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  // bind methods
  vm.edit = edit;
  vm.remove = remove;

  /**
   *
   * @param dataCollectorManagement
   */
  function edit(dataCollectorManagement) {
    $state.go('data_collector_management.edit', { id : dataCollectorManagement.id });
  }

  /**
   *
   * @param id
   */
  function remove(id) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(() => {
        DataCollectorManagement.delete(id)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            loadGrid();
          })
          .catch(Notify.handleError);
      });
  }
  /**
   *
   * @param error
   */
  function handleError(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  // load user grid
  /**
   *
   */
  function loadGrid() {
    toggleLoadingIndicator();
    vm.hasError = false;
    vm.loading = true;

    DataCollectorManagement.read()
      .then((dataCollectorManagement) => {
        vm.gridOptions.data = dataCollectorManagement;
      })
      .catch(handleError)
      .finally(toggleLoadingIndicator);
  }

  /**
   *
   */
  function toggleLoadingIndicator() {
    vm.loading = false;
  }

  loadGrid();
}
