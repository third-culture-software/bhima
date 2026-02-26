angular.module('bhima.controllers')
  .controller('ConfigurationEmployeeController', ConfigurationEmployeeController);

ConfigurationEmployeeController.$inject = [
  'ConfigurationEmployeeService', 'ModalService',
  'NotifyService', 'uiGridConstants', '$state', 'SessionService',
];

/**
 * Configuration Employee Management Controller
 *
 * This controller is about the Employee management module in the admin zone
 * It's responsible for creating, editing and updating a Employee
 * @param Configs
 * @param ModalService
 * @param Notify
 * @param uiGridConstants
 * @param $state
 * @param Session
 */
function ConfigurationEmployeeController(
  Configs, ModalService,
  Notify, uiGridConstants, $state, Session,
) {
  const vm = this;

  // bind methods
  vm.deleteConfig = deleteConfig;
  vm.editConfig = editConfig;
  vm.toggleFilter = toggleFilter;
  vm.currencySymbol = Session.enterprise.currencySymbol;

  // global variables
  vm.gridApi = {};
  vm.filterEnabled = false;

  const gridColumn = [
    { field : 'label', displayName : 'FORM.LABELS.DESIGNATION', headerCellFilter : 'translate' },
    {
      field : 'configuredText',
      displayName : 'FORM.LABELS.CONFIGURED',
      cellClass : 'text-right',
      headerCellFilter : 'translate',
    },
    {
      field : 'action',
      width : 80,
      displayName : '',
      cellTemplate : '/modules/payroll/employee_configuration/templates/action.tmpl.html',
      enableSorting : false,
      enableFiltering : false,
    },
  ];

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

  /**
   *
   */
  function loadConfigs() {
    vm.loading = true;

    Configs.read()
      .then((data) => {

        vm.gridOptions.data = data.map(row => {
          row.configuredText = `${row.numEmployees} / ${row.totalEmployees}`;
          return row;
        });

      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  // switch to delete warning mode
  /**
   *
   * @param title
   */
  function deleteConfig(title) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then((bool) => {
        if (!bool) { return; }

        Configs.delete(title.id)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            loadConfigs();
          })
          .catch(Notify.handleError);
      });
  }

  // update an existing Employee Configuration
  /**
   *
   * @param title
   */
  function editConfig(title) {
    $state.go('configurationEmployee.edit', { id : title.id });
  }

  loadConfigs();
}
