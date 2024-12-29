angular.module('bhima.controllers')
  .controller('ConfigurationController', ConfigurationController);

ConfigurationController.$inject = [
  'ConfigurationService', 'ModalService', 'NotifyService', 'uiGridConstants',
];

/**
 * Rubric Configuration Controller
 *
 * This controller is about the rubric configuration module in the admin zone
 * It is responsible for creating, updating, and deleting rubric configurations.
 */
function ConfigurationController(Configs, ModalService, Notify, uiGridConstants) {
  const vm = this;

  const gridColumn = [
    { field : 'label', displayName : 'FORM.LABELS.DESIGNATION', headerCellFilter : 'translate' },
    {
      field : 'action',
      width : 80,
      displayName : '',
      cellTemplate : '/modules/payroll/rubric_configuration/templates/action.tmpl.html',
      enableSorting : false,
      enableFiltering : false,
    },
  ];

  // bind methods
  vm.deleteConfig = deleteConfig;
  vm.toggleFilter = toggleFilter;

  // global variables
  vm.gridApi = {};
  vm.filterEnabled = false;

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider  : vm,
    enableColumnMenus : false,
    fastWatch         : true,
    flatEntityAccess  : true,
    enableSorting     : true,
    onRegisterApi     : onRegisterApiFn,
    columnDefs : gridColumn,
  };

  function onRegisterApiFn(gridApi) {
    vm.gridApi = gridApi;
  }

  function toggleFilter() {
    vm.filterEnabled = !vm.filterEnabled;
    vm.gridOptions.enableFiltering = vm.filterEnabled;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  function loadConfigs() {
    vm.loading = true;

    Configs.read()
      .then(data => {
        vm.gridOptions.data = data;
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  // switch to delete warning mode
  function deleteConfig(rubric) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then((bool) => {
        if (!bool) { return 0; }
        return Configs.delete(rubric.id);
      })
      .then(() => {
        Notify.success('FORM.INFO.DELETE_SUCCESS');
        loadConfigs();
      })
      .catch(Notify.handleError);
  }

  loadConfigs();
}
