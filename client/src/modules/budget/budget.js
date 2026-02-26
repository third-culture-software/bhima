angular.module('bhima.controllers')
  .controller('BudgetController', BudgetController);

BudgetController.$inject = [
  'BudgetService', 'SessionService', 'FiscalService', 'GridColumnService', 'GridStateService',
  'NotifyService', '$state', '$translate', '$uibModal', 'bhConstants',
];

/**
 * BudgetController
 *
 * This controller is responsible for displaying accounts and their balances
 */ /* eslint-disable-next-line */
function BudgetController(
  Budget, Session, Fiscal, Columns, GridState,
  Notify, $state, $translate, $uibModal, bhConstants,
) {
  const { TITLE } = bhConstants.accounts;

  const vm = this;
  const cacheKey = 'budget-grid';

  vm.loading = false;

  vm.enterprise = Session.enterprise;

  // vm.displayNames = [];
  vm.year = {};

  vm.toggleHideTitleAccount = toggleHideTitleAccount;
  vm.historicPeriods = [];

  vm.hideTitleAccount = false;
  vm.indentTitleSpace = 15;
  const isNotTitleAccount = (account) => account.type_id !== TITLE;

  // Define exports
  vm.downloadExcelQueryString = downloadExcelQueryString;
  vm.editAccountBudget = editAccountBudget;
  vm.exportToQueryString = exportToQueryString;
  vm.importBudgetCSV = importBudgetCSV;
  vm.onSelectFiscalYear = onSelectFiscalYear;
  vm.openColumnConfiguration = openColumnConfiguration;

  vm.months = Budget.budgetPeriods();

  // Add month abbreviations
  vm.months.forEach(mo => {
    mo.abbr = ($translate.instant(mo.label)).substring(0, 1);
  });

  const columns = [
    {
      field            : 'number',
      displayName      : 'TABLE.COLUMNS.ACCOUNT',
      enableFiltering  : false,
      headerCellFilter : 'translate',
      headerCellClass  : 'wrappingColHeader',
      cellTemplate     : '/modules/budget/templates/acct_number.cell.html',
      width : 80,
    }, {
      field            : 'label',
      displayName      : 'TABLE.COLUMNS.LABEL',
      enableFiltering  : false,
      headerCellFilter : 'translate',
      cellTemplate     : '/modules/budget/templates/acct_label.cell.html',
      width : '25%',
    }, {
      field            : 'type',
      displayName      : 'TABLE.COLUMNS.TYPE',
      enableFiltering  : false,
      headerCellFilter : 'translate',
      cellTemplate     : '/modules/budget/templates/acct_type.cell.html',
    }, {
      field            : 'budget',
      displayName      : 'BUDGET.FY_BUDGET',
      headerCellFilter : 'translate',
      headerCellClass  : 'wrappingColHeader',
      cellTemplate     : '/modules/budget/templates/budget.cell.html',
      type             : 'number',
      enableFiltering  : false,
      footerCellFilter : 'currency: grid.appScope.enterprise.currency_id:0',
      footerCellClass  : 'text-right',
    }, {
      name             : 'budgetYTD',
      displayName      : 'BUDGET.BUDGET_YTD',
      headerCellFilter : 'translate',
      headerCellClass  : 'wrappingColHeader',
      cellTemplate     : '/modules/budget/templates/budgetYTD.cell.html',
      type             : 'number',
      enableFiltering  : false,
    }, {
      name             : 'actuals',
      displayName      : 'BUDGET.FY_ACTUALS',
      headerCellFilter : 'translate',
      headerCellClass  : 'wrappingColHeader',
      cellTemplate     : '/modules/budget/templates/actuals.cell.html',
      type             : 'number',
      enableFiltering  : false,
      footerCellFilter : 'currency: grid.appScope.enterprise.currency_id:0',
      footerCellClass  : 'text-right',
    }, {
      name             : 'difference',
      displayName      : 'BUDGET.DIFFERENCE_YTD',
      headerTooltip    : 'BUDGET.DIFFERENCE_YTD_TOOLTIP',
      headerCellFilter : 'translate',
      headerCellClass  : 'wrappingColHeader',
      cellTemplate     : '/modules/budget/templates/differenceYTD.cell.html',
      type             : 'number',
      enableFiltering  : false,
      visible          : true,
    }, {
      name             : 'deviationPct',
      displayName      : 'BUDGET.FY_DEVIATION',
      headerTooltip    : 'BUDGET.DIFFERENCE_YTD_TOOLTIP',
      headerCellFilter : 'translate',
      headerCellClass  : 'wrappingColHeader',
      cellTemplate     : '/modules/budget/templates/deviationPct.cell.html',
      type             : 'number',
      enableFiltering  : false,
      visible          : false,
    }, {
      name             : 'deviationYTDPct',
      displayName      : 'BUDGET.DEVIATION_YTD',
      headerCellFilter : 'translate',
      headerCellClass  : 'wrappingColHeader',
      cellTemplate     : '/modules/budget/templates/deviationYTDPct.cell.html',
      type             : 'number',
      enableFiltering  : false,
    },
  ];

  // Add columns for the months
  vm.months.forEach(mon => {
    // Add the budget column for the month
    columns.push({
      name             : mon.key,
      displayName      : mon.label,
      headerCellTemplate : '/modules/budget/templates/period_budget_header.cell.html',
      cellClass        : 'text-right',
      cellTemplate     : `/modules/budget/templates/period_budget.cell.html`,
      visible          : false,
      width : '10%',
    });

    // Add the actuals column for the month
    const actualsLabel = `BUDGET.ACTUALS.${mon.label.replace('PERIODS.NAME.', '')}`;
    columns.push({
      name             : `${mon.key}_actuals`,
      displayName      : actualsLabel,
      headerCellTemplate : '/modules/budget/templates/period_actuals_header.cell.html',
      cellClass        : 'text-right',
      cellTemplate     : `/modules/budget/templates/period_actuals.cell.html`,
      visible          : false,
      width : '10%',
    });
  });

  // Add the action menu
  columns.push({
    field            : 'action',
    displayName      : '',
    cellTemplate     : '/modules/budget/templates/action.tmpl.html',
    enableFiltering  : false,
    enableSorting    : false,
    enableColumnMenu : false,
  });

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider   : vm,
    enableColumnMenus  : false,
    fastWatch          : true,
    flatEntityAccess   : true,
    enableSorting      : false,
    onRegisterApi      : onRegisterApiFn,
    columnDefs         : columns,
  };

  const gridColumns = new Columns(vm.gridOptions, cacheKey);
  const state = new GridState(vm.gridOptions, cacheKey);

  vm.saveGridState = state.saveGridState;
  vm.clearGridState = function clearGridState() {
    state.clearGridState();
    $state.reload();
  };

  vm.specialTitleRow = function specialTitleRow(entity) {
    return ['total-income', 'total-expenses', 'total-summary'].includes(entity.acctType);
  };

  vm.getPeriodActuals = function getPeriodActuals(month, entity) {
    const periods = entity.period;
    if (!angular.isDefined(periods) || periods === null) {
      return '';
    }
    const key = month.replace('_actuals', '');
    const info = periods.find(item => item.key === key) || '';
    if (!info || !angular.isDefined(info.actuals) || info.actuals === null) {
      return '';
    }
    return info.actuals;
  };

  vm.getPeriodBudget = function getPeriodBudget(month, periods) {
    if (!angular.isDefined(periods) || periods === null) {
      return '';
    }
    const info = periods.find(item => item.key === month) || '';
    return info.budget;
  };

  vm.getPeriodBudgetLocked = function getPeriodBudgetLocked(month, periods) {
    if (!angular.isDefined(periods) || periods === null) {
      return false;
    }
    const pinfo = periods.find(item => item.key === month);
    if (!pinfo || !angular.isDefined(pinfo.locked)) {
      return false;
    }
    return pinfo.locked;
  };

  vm.getMonthLabel = function getMonthLabel(name) {
    const key = name.replace('_actuals', '');
    const month = vm.months.find(item => item.key === key);
    if (month) {
      return month.label;
    }
    return 'NOT FOUND';
  };

  /**
   *
   * @param gridApi
   */
  function onRegisterApiFn(gridApi) {
    vm.gridApi = gridApi;
    gridApi.grid.registerDataChangeCallback(expandOnSetData);
  }

  /**
   *
   * @param err
   */
  function handleError(err) {
    vm.hasError = true;
    Notify.handleError(err);
  }

  vm.toggleMonth = function toggleMonth(month) {
    const cols = gridColumns.getColumnVisibilityMap();
    const monthActuals = `${month}_actuals`;
    cols[month] = !cols[month];
    cols[monthActuals] = !cols[monthActuals];
    gridColumns.setVisibleColumns(cols);
  };

  /**
   *
   */
  function hideTitles() {
    if (vm.hideTitleAccount) {
      const dataview = vm.data.filter(isNotTitleAccount);

      // squash the tree level so that no grouping occurs
      dataview.forEach(account => {
        account.$$treeLevel = 0;
      });

      // Update grid
      vm.gridOptions.data = dataview;

    } else {
      const dataview = vm.data;

      // restore the tree level to restore grouping
      dataview.forEach(account => {
        account.$$treeLevel = account._$$treeLevel;
      });

      // Update grid
      vm.gridOptions.data = dataview;
    }
  }

  /**
   *
   */
  function openColumnConfiguration() {
    gridColumns.openConfigurationModal();
  }

  // specify if titles accounts should be hidden
  /**
   *
   */
  function toggleHideTitleAccount() {
    vm.hideTitleAccount = !vm.hideTitleAccount;
    hideTitles();
  }

  /**
   *
   * @param grid
   */
  function expandOnSetData(grid) {
    if (grid.options.data.length > 0) {
      grid.api.treeBase.expandAllRows();
    }
  }

  /**
   *
   */
  function importBudgetCSV() {
    const budget = { year : vm.year };
    return $uibModal.open({
      templateUrl : 'modules/budget/modal/import.html',
      controller : 'ImportBudgetModalController as ModalCtrl',
      keyboard : false,
      backdrop : 'static',
      size : 'md',
      resolve : {
        data : () => budget,
      },
    }).result
      .then(() => {
        load({ fiscal_year_id : vm.year.id });
      });
  }

  /**
   *
   * @param renderer
   */
  function exportToQueryString(renderer) {
    const filename = $translate.instant('BUDGET.EXPORT.REPORT_FILENAME', { fyName : vm.fiscalYearLabel });
    const params = {
      fiscal_year_id : vm.year.id,
      filename : filename.replaceAll(' ', '-'),
    };
    return Budget.exportToQueryString(renderer, params);
  }

  /**
   *
   */
  function downloadExcelQueryString() {
    const filename = $translate.instant('BUDGET.EXPORT.REPORT_FILENAME', { fyName : vm.fiscalYearLabel });
    const params = {
      fiscal_year_id : vm.year.id,
      filename : filename.replaceAll(' ', '-'),
    };
    return Budget.downloadExcelQueryString(params);
  }

  /**
   *
   * @param account
   */
  function editAccountBudget(account) {
    const params = { year : vm.year, account };
    return $uibModal.open({
      templateUrl : 'modules/budget/modal/editAccountBudget.html',
      controller : 'EditAccountBudgetModalController as ModalCtrl',
      keyboard : false,
      backdrop : 'static',
      size : 'md',
      resolve : {
        data : () => params,
      },
    }).result
      .then(() => {
        load({ fiscal_year_id : vm.year.id });
      });
  }

  /**
   * Load the budget data
   * @param {object} options - options
   */
  function load(options) {
    vm.loading = true;
    const fiscalYearId = options.fiscal_year_id;

    Budget.loadData(fiscalYearId)
      .then(budgetData => {
        vm.data = budgetData;
        vm.gridOptions.data = vm.data;
      })
      .then(() => {
        hideTitles();
      })
      .catch(handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  /**
   * fired when the footer changes and on startup.
   * @param {object} year - new fiscal year object
   */
  async function onSelectFiscalYear(year) {
    vm.year = year;
    vm.fiscalYearLabel = vm.year.label;
    vm.historicPeriods = await Budget.getPeriodsWithActuals(vm.year.id);
    vm.filters = {
      fiscal_year_id : vm.year.id,
    };

    load(vm.filters);
  }

  /**
   * Runs on startup
   */
  function startup() {
    Fiscal.read(null, { detailed : 1, includePeriods : 1 })
      .then((years) => {
        vm.fiscalYears = years;

        // get the last year
        onSelectFiscalYear(years[0]);
      })
      .catch(Notify.handleError);
  }

  startup();
}
