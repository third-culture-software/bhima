angular.module('bhima.controllers')
  .controller('DistributionKeyController', DistributionKeyController);

DistributionKeyController.$inject = [
  'DistributionCenterService', 'NotifyService', 'uiGridConstants',
  'GridGroupingService', 'uiGridGroupingConstants',
];

/**
 * Update Distribution Center Controller
 *
 * This controller is about the updating Distribution Center module in the Finance zone
 * It's responsible for editing and updating a Distribution Center
 * @param DistributionCenters
 * @param Notify
 * @param uiGridConstants
 * @param Grouping
 * @param uiGridGroupingConstants
 */
function DistributionKeyController(DistributionCenters, Notify, uiGridConstants,
  Grouping, uiGridGroupingConstants) {
  const vm = this;

  // bind methods
  vm.toggleFilter = toggleFilter;
  vm.settings = settings;

  // global variables
  vm.gridApi = {};
  vm.loading = false;

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider  : vm,
    enableColumnMenus : false,
    fastWatch         : true,
    flatEntityAccess  : true,
    showColumnFooter  : true,
    enableSorting     : true,
    onRegisterApi     : onRegisterApiFn,
    showGridFooter : true,
    gridFooterTemplate : 'modules/allocation_center/templates/footer.template.html',

    columnDefs : [{
      field : 'auxiliary_label',
      displayName : 'TABLE.COLUMNS.AUXILIARY_CENTER',
      headerCellFilter : 'translate',
    }, {
      field : 'principal_label',
      displayName : 'TABLE.COLUMNS.PRINCIPAL_CENTER',
      headerCellFilter : 'translate',
    }, {
      field : 'rate',
      type : 'number',
      displayName : 'TABLE.COLUMNS.RATE',
      headerCellFilter : 'translate',
      cellClass : 'text-right',
      footerCellClass : 'text-right',
      cellFilter : 'percentage',
      footerCellFilter : 'percentage',
      enableFiltering : true,
      treeAggregationType : uiGridGroupingConstants.aggregation.SUM,
      customTreeAggregationFinalizerFn : (aggregation) => {
        aggregation.rendered = aggregation.value;
      },
    }, {
      field : 'user_name',
      displayName : 'TABLE.COLUMNS.RESPONSIBLE',
      headerCellFilter : 'translate',
    }, {
      field : 'action',
      width : 120,
      displayName : '',
      cellTemplate : '/modules/allocation_center/templates/setting.tmpl.html',
      enableSorting : false,
      enableFiltering : false,
    }],
  };

  vm.grouping = new Grouping(vm.gridOptions, true, 'auxiliary_label', vm.grouped, true);

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

  // settings distribution keys
  /**
   *
   * @param distributions
   */
  function settings(distributions) {
    const dataSettings = distributions[0].row.entity;
    const settingsValues = [];

    distributions.forEach(item => {
      settingsValues.push({
        auxiliary_cost_center_id : item.row.entity.auxiliary_cost_center_id,
        principal_cost_center_id : item.row.entity.principal_cost_center_id,
        rate : item.row.entity.rate,
      });
    });

    dataSettings.settingsValues = settingsValues;

    DistributionCenters.openDistributionKeyModal(dataSettings)
      .then((changes) => {
        if (changes) {
          load();
        }
      });
  }

  /**
   *
   */
  function load() {
    // flush error and loading states
    vm.hasError = false;
    toggleLoadingIndicator();

    DistributionCenters.getDistributionKey()
      .then((data) => {
        vm.gridOptions.data = data;
        vm.grouping.unfoldAllGroups();
      })
      .catch(errorHandler)
      .finally(toggleLoadingIndicator);
  }

  /**
   * @function toggleLoadingIndicator
   * @description
   * Toggles the grid's loading indicator to eliminate the flash when rendering
   * transactions and allow a better UX for slow loads.
   */
  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  /**
   * @param error
   * @function errorHandler
   * @description
   * Uses Notify to show an error in case the server sends back an information.
   * Triggers the error state on the grid.
   */
  function errorHandler(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  load();
}
