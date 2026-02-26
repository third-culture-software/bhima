angular.module('bhima.controllers')
  .controller('UpdateCenterController', UpdateCenterController);

UpdateCenterController.$inject = [
  'DistributionCenterUpdateService', 'DistributionCenterService', 'ModalService', 'NotifyService', 'uiGridConstants',
  '$state', 'GridGroupingService', 'uiGridGroupingConstants', 'SessionService',
];

/**
 * Update Distribution Center Controller
 *
 * This controller is about the updating Distribution Center module in the Finance zone
 * It's responsible for editing and updating a Distribution Center
 * @param DistributionUpdateCenters
 * @param DistributionCenters
 * @param ModalService
 * @param Notify
 * @param uiGridConstants
 * @param $state
 * @param Grouping
 * @param uiGridGroupingConstants
 * @param Session
 */
function UpdateCenterController(
  DistributionUpdateCenters, DistributionCenters, ModalService, Notify, uiGridConstants,
  $state, Grouping, uiGridGroupingConstants, Session,
) {
  const vm = this;

  // bind methods
  vm.toggleFilter = toggleFilter;

  // global variables
  vm.gridApi = {};
  vm.setting = setting;
  vm.loading = false;
  vm.updateDistribution = updateDistribution;
  vm.onRemoveFilter = onRemoveFilter;

  const customTreeAggregationFinalizerFn = (aggregation) => {
    aggregation.rendered = aggregation.value;
  };

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider  : vm,
    enableColumnMenus : false,
    fastWatch         : true,
    flatEntityAccess  : true,
    showColumnFooter  : true,
    enableSorting     : true,
    showGridFooter : true,
    gridFooterTemplate : 'modules/allocation_center/templates/footer.template.html',
    onRegisterApi     : onRegisterApiFn,
    columnDefs : [{
      field : 'trans_id',
      displayName : 'TABLE.COLUMNS.TRANSACTION',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/journal/templates/transaction-id.cell.html',
    }, {
      field : 'hrRecord',
      displayName : 'TABLE.COLUMNS.RECORD',
      headerCellFilter : 'translate',
      visible : true,
      cellTemplate : '/modules/journal/templates/record.cell.html',
      footerCellTemplate : '<i></i>',
    }, {
      field : 'cost_center_label',
      displayName : 'TABLE.COLUMNS.AUXILIARY_CENTER',
      headerCellFilter : 'translate',
    }, {
      field : 'principal_label',
      displayName : 'TABLE.COLUMNS.PRINCIPAL_CENTER',
      headerCellFilter : 'translate',
    }, {
      field : 'trans_date',
      cellFilter : 'date',
      displayName : 'TABLE.COLUMNS.DATE',
      headerCellFilter : 'translate',
      type : 'date',
      footerCellTemplate : '<i></i>',
    }, {
      field : 'account_number',
      displayName : 'TABLE.COLUMNS.ACCOUNT',
      cellTemplate : '/modules/journal/templates/account.cell.html',
      headerCellFilter : 'translate',
    }, {
      field : 'debit_equiv',
      type : 'number',
      headerCellFilter : 'translate',
      displayName : 'TABLE.COLUMNS.DEBIT',
      cellClass : 'text-right',
      footerCellClass : 'text-right',
      footerCellFilter : 'number:2',
      enableFiltering : true,
      treeAggregationType : uiGridGroupingConstants.aggregation.SUM,
      cellFilter : 'currency:'.concat(Session.enterprise.currency_id),
      customTreeAggregationFinalizerFn,
    }, {
      field : 'credit_equiv',
      type : 'number',
      displayName : 'TABLE.COLUMNS.CREDIT',
      headerCellFilter : 'translate',
      cellClass : 'text-right',
      footerCellClass : 'text-right',
      footerCellFilter : 'number:2',
      enableFiltering : true,
      treeAggregationType : uiGridGroupingConstants.aggregation.SUM,
      cellFilter : 'currency:'.concat(Session.enterprise.currency_id),
      customTreeAggregationFinalizerFn,
    }, {
      field : 'user_name',
      displayName : 'TABLE.COLUMNS.RESPONSIBLE',
      headerCellFilter : 'translate',
    }, {
      field : 'action',
      width : 80,
      displayName : '',
      cellTemplate : '/modules/allocation_center/templates/update.tmpl.html',
      enableSorting : false,
      enableFiltering : false,
    }],
  };

  vm.grouping = new Grouping(vm.gridOptions, true, 'trans_id');

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

  // setting
  /**
   *
   */
  function setting() {
    const filtersSnapshot = DistributionUpdateCenters.filters.formatHTTP();
    DistributionCenters.openSettingModal(filtersSnapshot)
      .then((changes) => {
        if (changes) {
          DistributionUpdateCenters.filters.replaceFilters(changes);
          DistributionUpdateCenters.cacheFilters();
          vm.latestViewFilters = DistributionUpdateCenters.filters.formatView();
          loadDistributionCenters(DistributionUpdateCenters.filters.formatHTTP(true));
        }
      });
  }

  // Update distribution
  /**
   *
   * @param distributions
   */
  function updateDistribution(distributions) {
    const dataUpdate = distributions[0].row.entity;
    const distributionValues = [];

    distributions.forEach(item => {
      distributionValues.push({
        id : item.row.entity.principal_cost_center_id,
        debit_equiv : item.row.entity.debit_equiv,
        credit_equiv : item.row.entity.credit_equiv,
      });
    });

    dataUpdate.updating = true;
    dataUpdate.distributionValues = distributionValues;

    DistributionCenters.openDistributionModal(dataUpdate)
      .then((changes) => {
        if (changes) {
          DistributionUpdateCenters.cacheFilters();
          vm.latestViewFilters = DistributionUpdateCenters.filters.formatView();
          loadDistributionCenters(DistributionUpdateCenters.filters.formatHTTP(true));
        }
      });
  }

  /**
   *
   * @param filters
   */
  function load(filters) {
    // flush error and loading states
    vm.hasError = false;
    toggleLoadingIndicator();

    DistributionCenters.getDistributed(filters)
      .then((data) => {
        vm.gridOptions.data = data;
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

  // remove a filter with from the filter object, save the filters and reload
  /**
   *
   * @param key
   */
  function onRemoveFilter(key) {
    DistributionUpdateCenters.removeFilter(key);

    DistributionUpdateCenters.cacheFilters();
    vm.latestViewFilters = DistributionUpdateCenters.filters.formatView();

    load(DistributionUpdateCenters.filters.formatHTTP(true));
  }

  /**
   *
   */
  function loadDistributionCenters() {
    if ($state.params.filters.length) {
      DistributionUpdateCenters.filters.replaceFiltersFromState($state.params.filters);
      DistributionUpdateCenters.cacheFilters();
    }

    vm.latestViewFilters = DistributionUpdateCenters.filters.formatView();

    // If there is no filter open the window to select the pay period
    if (!vm.latestViewFilters.defaultFilters.length) {
      setting();
    } else {
      load(DistributionUpdateCenters.filters.formatHTTP(true));
    }
  }

  loadDistributionCenters();
}
