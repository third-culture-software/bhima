angular.module('bhima.controllers')
  .controller('ConfigurationWeekendController', ConfigurationWeekendController);

ConfigurationWeekendController.$inject = [
  'ConfigurationWeekendService', 'ModalService', 'NotifyService', 'uiGridConstants',
];

/**
 * Weekend Management Controller
 * @param Configs
 * @param Modals
 * @param Notify
 * @param uiGridConstants
 * @description
 * This controller is about the Weekend management module in the admin zone
 * It's responsible for creating, editing and updating a Weekend
 */
function ConfigurationWeekendController(Configs, Modals, Notify, uiGridConstants) {
  const vm = this;

  // bind methods
  vm.deleteConfig = deleteConfig;
  vm.toggleFilter = toggleFilter;

  // global variables
  vm.gridApi = {};

  const gridColumn = [{
    field : 'label',
    displayName : 'FORM.LABELS.DESIGNATION',
    headerCellFilter : 'translate',
  }, {
    field : 'action',
    width : 80,
    displayName : '',
    cellTemplate : '/modules/payroll/weekend_configuration/templates/action.tmpl.html',
    enableSorting : false,
    enableFiltering : false,
  }];

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
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  /**
   *
   */
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
  /**
   *
   * @param title
   */
  function deleteConfig(title) {
    Modals.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(bool => {
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
