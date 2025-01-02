angular.module('bhima.controllers')
  .controller('FunctionManagementController', FunctionManagementController);

FunctionManagementController.$inject = [
  'FunctionService', 'ModalService', 'NotifyService', 'uiGridConstants',
];

/**
 * Function Management Controller
 *
 * This controller is about the Job Title management module in the admin zone
 * It's responsible for creating, editing and updating a Job Title
 */
function FunctionManagementController(Functions, Modals, Notify, uiGridConstants) {
  const vm = this;

  // bind methods
  vm.deleteFunction = deleteFunction;
  vm.toggleFilter = toggleFilter;

  // global variables
  vm.gridApi = {};

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider : vm,
    enableColumnMenus : false,
    fastWatch : true,
    flatEntityAccess : true,
    enableSorting : true,
    onRegisterApi : onRegisterApiFn,
    columnDefs : [{
      field : 'fonction_txt',
      displayName : 'FORM.LABELS.DESIGNATION',
      headerCellFilter : 'translate',
    }, {
      field : 'numEmployees',
      displayName : 'TABLE.AGGREGATES.NUM_EMPLOYEES',
      headerCellFilter : 'translate',
    }, {
      field : 'action',
      width : 80,
      displayName : '',
      cellTemplate : '/modules/functions/templates/action.tmpl.html',
      enableSorting : false,
      enableFiltering : false,
    }],
  };

  function onRegisterApiFn(gridApi) {
    vm.gridApi = gridApi;
  }

  function toggleFilter() {
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  function loadFunctions() {
    vm.loading = true;

    Functions.read(null, { detailed : 1 })
      .then((data) => {
        vm.gridOptions.data = data;
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  // switch to delete warning mode
  function deleteFunction(profession) {
    Modals.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then((bool) => {
        if (!bool) { return; }

        Functions.delete(profession.id)
          .then(() => {
            Notify.success('PROFESSION.DELETED');
            loadFunctions();
          })
          .catch(Notify.handleError);
      });
  }

  loadFunctions();
}
