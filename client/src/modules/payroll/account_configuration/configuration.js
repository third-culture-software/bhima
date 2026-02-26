angular.module('bhima.controllers')
  .controller('ConfigurationAccountController', ConfigurationAccountController);

ConfigurationAccountController.$inject = [
  'ConfigurationAccountService', 'ModalService',
  'NotifyService', 'uiGridConstants', '$state', 'SessionService',
];

/**
 * Configuration Account Controller
 *
 * This controller is about the Account management module in the admin zone
 * It's responsible for creating, editing and updating a Account
 * @param Configs
 * @param ModalService
 * @param Notify
 * @param uiGridConstants
 * @param $state
 * @param Session
 */
function ConfigurationAccountController(
  Configs, ModalService, Notify, uiGridConstants, $state, Session,
) {
  const vm = this;

  // bind methods
  vm.deleteConfig = deleteConfig;
  vm.toggleFilter = toggleFilter;
  vm.currencySymbol = Session.enterprise.currencySymbol;

  // global variables
  vm.gridApi = {};
  vm.filterEnabled = false;

  const gridColumn = [
    { field : 'label', displayName : 'FORM.LABELS.DESIGNATION', headerCellFilter : 'translate' },
    { field : 'hrAccountText', displayName : 'FORM.LABELS.ACCOUNT', headerCellFilter : 'translate' },
    {
      field : 'action',
      width : 80,
      displayName : '',
      cellTemplate : '/modules/payroll/account_configuration/templates/action.tmpl.html',
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
        data.forEach(row => {
          row.hrAccountText = `[${row.account_number}] ${row.account_label}`;
        });

        vm.gridOptions.data = data;
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
    return ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
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

  loadConfigs();
}
