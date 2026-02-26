angular.module('bhima.controllers')
  .controller('DistributionCenterController', DistributionCenterController);

DistributionCenterController.$inject = [
  'DistributionCenterService', 'NotifyService', 'uiGridConstants', '$state', 'GridColumnService',
  'GridStateService', 'util', 'bhConstants', 'SessionService',
];

/**
 * Distribution Center Controller
 *
 * This controller is about the Distribution Center module in the admin zone
 * It's responsible for creating, editing and updating a Distribution Center
 * @param DistributionCenters
 * @param Notify
 * @param uiGridConstants
 * @param $state
 * @param Columns
 * @param GridState
 * @param util
 * @param bhConstants
 * @param Session
 */
function DistributionCenterController(DistributionCenters, Notify, uiGridConstants, $state, Columns,
  GridState, util, bhConstants, Session) {
  const vm = this;
  const cacheKey = 'distribution_grid';

  // bind methods
  vm.toggleFilter = toggleFilter;
  // global variables
  vm.gridApi = {};
  vm.setting = setting;
  vm.loading = false;
  vm.distribution = distribution;
  vm.openColumnConfigModal = openColumnConfigModal;
  vm.clearGridState = clearGridState;
  vm.onRemoveFilter = onRemoveFilter;
  vm.breakdownPercentages = breakdownPercentages;
  vm.automaticBreakdown = automaticBreakdown;
  vm.format = util.formatDate;

  const TRANSACTION_TYPE_INVOICING = bhConstants.transactionType.INVOICING;

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider  : vm,
    enableColumnMenus : false,
    fastWatch         : true,
    flatEntityAccess  : true,
    enableSorting     : true,
    onRegisterApi     : onRegisterApiFn,
    showGridFooter : true,
    gridFooterTemplate : 'modules/allocation_center/templates/footer.template.html',
    columnDefs : [
      {
        field : 'cost_center_label',
        displayName : 'TABLE.COLUMNS.COST_CENTER',
        headerCellFilter : 'translate',
      }, {
        field : 'trans_id',
        displayName : 'TABLE.COLUMNS.TRANSACTION',
        headerCellFilter : 'translate',
        cellTemplate : 'modules/journal/templates/transaction-id.cell.html',
      }, {
        field : 'trans_date',
        cellFilter : 'date',
        displayName : 'TABLE.COLUMNS.DATE',
        headerCellFilter : 'translate',
        cellTemplate : '/modules/allocation_center/templates/date.cell.html',
        type : 'date',
      }, {
        field : 'hrRecord',
        displayName : 'TABLE.COLUMNS.RECORD',
        headerCellFilter : 'translate',
        visible : true,
        cellTemplate : '/modules/journal/templates/record.cell.html',
        footerCellTemplate : '<i></i>',
      }, {
        field : 'description',
        displayName : 'FORM.LABELS.DESCRIPTION',
        headerCellFilter : 'translate',
        visible : true,
      }, {
        field : 'account_number',
        displayName : 'TABLE.COLUMNS.ACCOUNT',
        cellTemplate : '/modules/journal/templates/account.cell.html',
        headerCellFilter : 'translate',
      }, {
        field : 'amount',
        type : 'number',
        displayName : 'TABLE.COLUMNS.AMOUNT_SOURCE',
        headerCellFilter : 'translate',
        cellClass : 'text-right',
        footerCellClass : 'text-right',
        cellFilter : 'currency:row.entity.currency_id',
        footerCellFilter : 'currency:row.entity.currency_id',
        enableFiltering : true,
      }, {
        field : 'amount_equiv',
        type : 'number',
        displayName : 'TABLE.COLUMNS.AMOUNT',
        headerCellFilter : 'translate',
        cellClass : 'text-right',
        footerCellClass : 'text-right',
        cellFilter : `currency:${Session.enterprise.currency_id}`,
        footerCellFilter : `currency:${Session.enterprise.currency_id}`,
        enableFiltering : true,
      }, {
        field : 'currencyName',
        displayName : 'TABLE.COLUMNS.CURRENCY',
        headerCellFilter : 'translate',
      }, {
        field : 'action',
        width : 80,
        displayName : '',
        cellTemplate : '/modules/allocation_center/templates/action.tmpl.html',
        enableSorting : false,
        enableFiltering : false,
      }],
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

  const gridColumns = new Columns(vm.gridOptions, cacheKey);
  const state = new GridState(vm.gridOptions, cacheKey);

  // setting
  /**
   *
   */
  function setting() {
    const filtersSnapshot = DistributionCenters.filters.formatHTTP();
    DistributionCenters.openSettingModal(filtersSnapshot)
      .then((changes) => {
        if (changes) {
          DistributionCenters.filters.replaceFilters(changes);
          DistributionCenters.cacheFilters();
          vm.latestViewFilters = DistributionCenters.filters.formatView();
          loadDistributionCenters(DistributionCenters.filters.formatHTTP(true));
        }
      });
  }

  // This function opens a modal through column service to let the user toggle
  // the visibility of the voucher registry's columns.
  /**
   *
   */
  function openColumnConfigModal() {
    // column configuration has direct access to the grid API to alter the current
    // state of the columns - this will be saved if the user saves the grid configuration
    gridColumns.openConfigurationModal();
  }

  vm.saveGridState = state.saveGridState;
  // saves the grid's current configuration
  /**
   *
   */
  function clearGridState() {
    state.clearGridState();
    $state.reload();
  }

  // deletes a filter from the custom filter object, this key will no longer be written to changes on exit
  vm.clear = function clear(key) {
    delete vm.searchQueries[key];
  };

  // distribution
  /**
   *
   * @param data
   */
  function distribution(data) {
    DistributionCenters.openDistributionModal(data)
      .then((changes) => {
        if (changes) {
          DistributionCenters.cacheFilters();
          vm.latestViewFilters = DistributionCenters.filters.formatView();
          loadDistributionCenters(DistributionCenters.filters.formatHTTP(true));
        }
      });
  }

  /**
   *
   */
  function breakdownPercentages() {
    const transactions = vm.gridApi.selection.getSelectedRows();

    if (transactions.length) {
      const costCenterId = transactions[0].cost_center_id;

      // returns true if Selecting differents auxiliary center transactions
      const isDifferente = transaction => transaction.cost_center_id !== costCenterId;
      const invalid = transactions.some(isDifferente);

      if (invalid) {
        Notify.warn('FORM.WARNINGS.PERCENTAGE_BREACKDOWN');
      } else {
        const filtersSnapshot = DistributionCenters.filters.formatHTTP();
        const isCost = filtersSnapshot.typeCostCenter;

        const data = {
          transactions,
          isCost,
        };

        DistributionCenters.breakDownPercentagesModal(data)
          .then((changes) => {
            if (changes) {
              DistributionCenters.cacheFilters();
              vm.latestViewFilters = DistributionCenters.filters.formatView();
              loadDistributionCenters(DistributionCenters.filters.formatHTTP(true));
            }
          });

      }
    } else {
      Notify.warn('FORM.WARNINGS.ATTENTION_SELECTED');
    }
  }

  /**
   *
   */
  function automaticBreakdown() {
    const transactions = vm.gridApi.selection.getSelectedRows();

    if (transactions.length) {
      // returns true if the  Selecting differents to transaction Type Invoicing
      const isDifferente = transaction => transaction.transaction_type_id !== TRANSACTION_TYPE_INVOICING;
      const invalid = transactions.some(isDifferente);

      if (invalid) {
        Notify.danger('FORM.WARNINGS.PERCENTAGE_BREACKDOWN');
      } else {
        DistributionCenters.automaticBreakdown(transactions)
          .then(() => {
            Notify.success('FORM.INFO.DISTRIBUTION_SUCCESSFULLY');
            vm.activePosting = true;
            $state.go('allocation_center', null, { reload : true });
          })
          .catch(Notify.handleError);
      }
    } else {
      Notify.warn('FORM.WARNINGS.ATTENTION_SELECTED');
    }
  }

  // remove a filter with from the filter object, save the filters and reload
  /**
   *
   * @param key
   */
  function onRemoveFilter(key) {
    DistributionCenters.removeFilter(key);

    DistributionCenters.cacheFilters();
    vm.latestViewFilters = DistributionCenters.filters.formatView();

    load(DistributionCenters.filters.formatHTTP(true));
  }

  /**
   *
   * @param filters
   */
  function load(filters) {
    // flush error and loading states
    vm.hasError = false;
    toggleLoadingIndicator();

    DistributionCenters.read(null, filters)
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

  /**
   *
   */
  function loadDistributionCenters() {
    if ($state.params.filters.length) {
      DistributionCenters.filters.replaceFiltersFromState($state.params.filters);
      DistributionCenters.cacheFilters();
    }

    vm.latestViewFilters = DistributionCenters.filters.formatView();

    // If there is no filter open the window to select the pay period
    if (!vm.latestViewFilters.defaultFilters.length) {
      setting();
    } else {
      load(DistributionCenters.filters.formatHTTP(true));
    }
  }

  loadDistributionCenters();
}
