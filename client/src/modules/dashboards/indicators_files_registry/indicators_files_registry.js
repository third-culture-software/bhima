angular.module('bhima.controllers')
  .controller('IndicatorsFilesRegistryController', IndicatorsFilesRegistryController);

IndicatorsFilesRegistryController.$inject = [
  '$state', 'NotifyService', 'uiGridConstants', 'GridColumnService',
  'GridStateService', 'LanguageService', 'ReceiptModal',
  'IndicatorsDashboardService',
];

/**
 *
 * @param $state
 * @param Notify
 * @param uiGridConstants
 * @param Columns
 * @param GridState
 * @param Languages
 * @param Receipts
 * @param IndicatorsDashboard
 */
function IndicatorsFilesRegistryController(
  $state, Notify, uiGridConstants, Columns, GridState,
  Languages, Receipts, IndicatorsDashboard,
) {
  const vm = this;

  const cacheKey = 'IndicatorFilesRegistry';

  // the grid registry filterer
  const grid = IndicatorsDashboard.indicatorsFilesGridFilterer;

  vm.loading = false;
  vm.search = search;
  vm.openColumnConfiguration = openColumnConfiguration;
  vm.onRemoveFilter = onRemoveFilter;
  vm.languageKey = Languages.key;
  vm.toggleInlineFilter = toggleInlineFilter;

  const columnDefs = [{
    field : 'service_name',
    displayName : 'FORM.LABELS.SERVICE',
    headerCellFilter : 'translate',
  }, {
    field : 'fiscal_year_label',
    displayName : 'DASHBOARD.INDICATORS_FILES.FISCAL_YEAR',
    headerCellFilter : 'translate',
  }, {
    field : 'period_start',
    displayName : 'DASHBOARD.INDICATORS_FILES.PERIOD',
    headerCellFilter : 'translate',
    cellFilter : 'date: "MMMM yyyy"',
  }, {
    field : 'type_translate_key',
    displayName : 'DASHBOARD.INDICATORS_FILES.TYPE',
    headerCellFilter : 'translate',
    cellFilter : 'translate',
  }, {
    field : 'status_translate_key',
    displayName : 'DASHBOARD.INDICATORS_FILES.STATUS',
    headerCellFilter : 'translate',
    cellFilter : 'translate',
  }, {
    field : 'display_name',
    displayName : 'DASHBOARD.INDICATORS_FILES.LAST_EDIT',
    headerCellFilter : 'translate',
  }, {
    name : 'actions',
    displayName : '',
    cellTemplate : '/modules/dashboards/indicators_files_registry/templates/action.cell.html',
    enableSorting : false,
    enableFiltering : false,
  }];

  vm.uiGridOptions = {
    appScopeProvider : vm,
    enableSorting : true,
    enableColumnMenus : false,
    flatEntityAccess : true,
    fastWatch : true,
    columnDefs,
  };

  vm.uiGridOptions.onRegisterApi = function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  };

  /**
   *
   */
  function toggleInlineFilter() {
    vm.uiGridOptions.enableFiltering = !vm.uiGridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }
  const columnConfig = new Columns(vm.uiGridOptions, cacheKey);
  const state = new GridState(vm.uiGridOptions, cacheKey);

  vm.saveGridState = state.saveGridState;
  vm.clearGridState = function clearGridState() {
    state.clearGridState();
    $state.reload();
  };

  // error handler
  /**
   *
   * @param error
   */
  function handler(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  // this function loads admissions from the database with search filters, if passed in.
  /**
   *
   * @param filters
   */
  function load(filters) {
    vm.hasError = false;
    vm.loading = true;
    return IndicatorsDashboard.indicatorsFiles.read(null, filters)
      .then((admissions) => {
        vm.uiGridOptions.data = admissions;
        vm.latestViewFilters = grid.latestViewFilters();
      })
      .catch(handler)
      .finally(toggleLoadingIndicator);
  }

  // grid : on startup
  /**
   *
   */
  function startup() {
    grid.startup($state.params, load);
  }

  // grid : search modal
  /**
   *
   */
  function search() {
    grid.search(IndicatorsDashboard.openIndicatorsFilesSearchModal, load);
  }

  // grid : on remove a filter
  /**
   *
   * @param key
   */
  function onRemoveFilter(key) {
    grid.onRemoveFilter(key, load);
  }

  /**
   *
   */
  function openColumnConfiguration() {
    columnConfig.openConfigurationModal();
  }

  // toggles the loading indicator on or off
  /**
   *
   */
  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  // edit
  vm.edit = (uuid, typeId) => {
    const map = {
      1 : 'indicatorsFilesRegistry.editHospitalizationFile',
      2 : 'indicatorsFilesRegistry.editStaffFile',
      3 : 'indicatorsFilesRegistry.editFinanceFile',
    };
    $state.go(map[typeId], { uuid });
  };

  // remove
  vm.remove = (uuid, typeId) => {
    const map = {
      1 : IndicatorsDashboard.hospitalization,
      2 : IndicatorsDashboard.staff,
      3 : IndicatorsDashboard.finances,
    };
    map[typeId].delete(uuid)
      .then(() => {
        Notify.success('FORM.INFO.DELETE_SUCCESS');
        grid.startup($state.params, load);
      });
  };

  // fire up the module
  startup();
}
