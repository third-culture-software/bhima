angular.module('bhima.controllers')
  .controller('ConfigurationAnalysisToolsController', ConfigurationAnalysisToolsController);

ConfigurationAnalysisToolsController.$inject = [
  '$state', 'ConfigurationAnalysisToolsService', 'NotifyService', 'uiGridConstants', 'ModalService', '$translate',
];

/**
 * Configuration Analysis Tools Controller
 * This module is responsible for handling the CRUD operation on Configuration Analysis Tools Controller
 */

/**
 *
 * @param $state
 * @param ConfigurationAnalysisTools
 * @param Notify
 * @param uiGridConstants
 * @param ModalService
 * @param $translate
 */
function ConfigurationAnalysisToolsController($state, ConfigurationAnalysisTools, Notify,
  uiGridConstants, ModalService, $translate) {
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
        displayName : 'FORM.LABELS.DESIGNATION',
        enableFiltering : true,
        headerCellFilter : 'translate',
      },
      {
        field : 'abbr',
        displayName : 'FORM.LABELS.REFERENCE',
        enableFiltering : true,
        headerCellFilter : 'translate',
      },
      {
        field : 'typeLabel',
        displayName : 'FORM.LABELS.TYPE',
        enableFiltering : true,
        headerCellFilter : 'translate',
      },
      {
        field : 'action',
        displayName : '',
        enableFiltering : false,
        width : 120,
        cellTemplate : '/modules/configuration_analysis_tools/templates/action.cell.html',
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
   * @param configurationAnalysisTools
   */
  function edit(configurationAnalysisTools) {
    $state.go('configuration_analysis_tools.edit', { id : configurationAnalysisTools.id });
  }

  /**
   *
   * @param id
   */
  function remove(id) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(() => {
        ConfigurationAnalysisTools.delete(id)
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

    ConfigurationAnalysisTools.read()
      .then((configurationAnalysisTools) => {
        configurationAnalysisTools.forEach((item) => {
          if (item.typeLabel) {
            item.typeLabel = $translate.instant(item.typeLabel);
          }

        });

        vm.gridOptions.data = configurationAnalysisTools;
      })
      .catch(handleError)
      .finally(toggleLoadingIndicator);
  }

  /**
   *
   */
  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  loadGrid();
}
