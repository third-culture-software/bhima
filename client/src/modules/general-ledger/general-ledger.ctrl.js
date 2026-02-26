angular.module('bhima.controllers')
  .controller('GeneralLedgerController', GeneralLedgerController);

GeneralLedgerController.$inject = [
  'GeneralLedgerService', 'SessionService', 'NotifyService', 'uiGridConstants',
  'GridColumnService', 'GridStateService', '$state',
  'LanguageService', 'ModalService', 'FiscalService', 'bhConstants',
  'AccountService', 'FormatTreeDataService',
];

/**
 * @param GeneralLedger
 * @param Session
 * @param Notify
 * @param uiGridConstants
 * @param Columns
 * @param GridState
 * @param $state
 * @param Languages
 * @param Modal
 * @param Fiscal
 * @param bhConstants
 * @param Accounts
 * @param FormatTreeData
 * @module GeneralLedgerController
 * @description
 * This controller is responsible for displaying accounts and their balances
 */
function GeneralLedgerController(
  GeneralLedger, Session, Notify, uiGridConstants, Columns,
  GridState, $state, Languages, Modal, Fiscal, bhConstants, Accounts, FormatTreeData,
) {
  const vm = this;
  const cacheKey = 'GeneralLedger';
  let columns = [];
  vm.displayNames = [];
  vm.year = {};
  vm.accounts = [];
  vm.toggleHideTitleAccount = toggleHideTitleAccount;
  vm.hideTitleAccount = false;

  const fields = [
    'balance',
    'balance0',
    'balance1',
    'balance2',
    'balance3',
    'balance4',
    'balance5',
    'balance6',
    'balance7',
    'balance8',
    'balance9',
    'balance10',
    'balance11',
    'balance12',
  ];

  vm.openColumnConfiguration = openColumnConfiguration;
  vm.onSelectFiscalYear = onSelectFiscalYear;
  vm.Constants = bhConstants;
  vm.aggregates = {};

  vm.indentTitleSpace = 15;
  const isNotTitleAccount = (account) => account.type_id !== bhConstants.accounts.TITLE;

  const tmpl = `
    <div class="ui-grid-cell-contents">
      <span style="padding-left : {{row.entity.$$treeLevel * grid.appScope.indentTitleSpace}}px;"></span>
      {{grid.getCellValue(row, col)}}
    </span>`;

  /**
   *
   * @param columnDefs
   * @param column
   */
  function customAggregationFn(columnDefs, column) {
    return (vm.aggregates[column.field] || 0).toFixed(2);
  }

  columns = [{
    field            : 'number',
    displayName      : 'TABLE.COLUMNS.ACCOUNT',
    enableFiltering  : true,
    headerCellFilter : 'translate',
    width : 80,
    cellClass        : 'text-left',
  }, {
    field            : 'label',
    displayName      : 'TABLE.COLUMNS.LABEL',
    enableFiltering  : true,
    headerCellFilter : 'translate',
    cellTemplate : tmpl,
  }, {
    field            : 'balance',
    type : 'number',
    displayName      : 'TABLE.COLUMNS.BALANCE',
    enableFiltering  : false,
    headerCellFilter : 'translate',
    headerCellClass  : 'text-center',
    cellFilter       : 'currency:'.concat(Session.enterprise.currency_id),
    cellClass        : 'text-right',
    footerCellClass  : 'text-right',
    footerCellFilter : 'currency:'.concat(Session.enterprise.currency_id),
    aggregationType : customAggregationFn,
    aggregationHideLabel : true,
  }, {
    field            : 'action',
    displayName      : '',
    cellTemplate     : '/modules/general-ledger/templates/action.cell.html',
    enableFiltering  : false,
    enableSorting    : false,
    enableColumnMenu : false,
  }];

  vm.gridApi = {};
  vm.toggleFilter = toggleFilter;

  vm.gridOptions = {
    columnDefs : columns,
    fastWatch : true,
    flatEntityAccess  : true,
    enableColumnMenus : false,
    showTreeExpandNoChildren : false,
    rowTemplate : '/modules/accounts/templates/grid.leafRow.tmpl.html',
    showColumnFooter : true,
    appScopeProvider  : vm,
    onRegisterApi : onRegisterApiFn,
  };

  const columnConfig = new Columns(vm.gridOptions, cacheKey);
  const state = new GridState(vm.gridOptions, cacheKey);

  vm.saveGridState = state.saveGridState;
  vm.clearGridState = function clearGridState() {
    state.clearGridState();
    $state.reload();
  };

  /**
   *
   * @param err
   */
  function handleError(err) {
    vm.hasError = true;
    Notify.handleError(err);
  }

  /**
   *
   */
  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  // API register function
  /**
   *
   * @param api
   */
  function onRegisterApiFn(api) {
    vm.gridApi = api;
    api.grid.registerDataChangeCallback(expandOnSetData);
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
  function openColumnConfiguration() {
    columnConfig.openConfigurationModal();
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
   * @param account
   */
  function preProcessAccounts(account) {
    account.hrlabel = Accounts.label(account);

    // remove zero values from the matrix to render as empty cells.
    fields.forEach((field) => {
      if (account[field] === 0) {
        delete account[field];
      }
    });
  }

  // specify if titles accounts should be hidden
  /**
   *
   */
  function toggleHideTitleAccount() {
    vm.hideTitleAccount = !vm.hideTitleAccount;
    hideTitles();
  }

  // Hide when possible title account
  /**
   *
   */
  function hideTitles() {
    if (vm.hideTitleAccount) {
      const dataview = vm.accounts.filter(isNotTitleAccount);

      // squash the tree level so that no grouping occurs
      dataview.forEach(account => {
        account.$$treeLevel = 0;
      });

      vm.gridOptions.data = dataview;

      // vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.OPTIONS);
    } else {
      const dataview = vm.accounts;

      // restore the tree level to restore grouping
      dataview.forEach(account => {
        account.$$treeLevel = account._$$treeLevel;
      });

      vm.gridOptions.data = dataview;
    }
  }

  /**
   *
   * @param accounts
   */
  function loadData(accounts = []) {
    accounts.forEach(preProcessAccounts);
    FormatTreeData.order(accounts);

    // cache each accounts $$treeLevel
    accounts.forEach(account => {
      account._$$treeLevel = account.$$treeLevel;
    });

    renameGidHeaders(vm.year);
    vm.gridOptions.data = accounts;
    vm.accounts = accounts;

    hideTitles();
  }

  vm.download = GeneralLedger.download;

  vm.openAccountReport = function openAccountReport(accountId) {
    const opts = {
      account_id : accountId,
      dateFrom : vm.year.start_date,
      dateTo : vm.year.end_date,
      limit : 1000,
      renderer : 'pdf',
    };

    return GeneralLedger.openAccountReport(opts);
  };

  // loads data for the general Ledger
  /**
   *
   * @param options
   */
  function load(options) {
    vm.loading = true;

    GeneralLedger.read(null, options)
      .then(loadData)
      .catch(handleError)
      .finally(toggleLoadingIndicator);

    GeneralLedger.aggregates(options)
      .then(([aggregates]) => {
        vm.aggregates = aggregates || {};
      });
  }

  // add (columns) period's label  in the ui-grid
  //
  /**
   *
   * @param year
   */
  function renameGidHeaders(year) {
    const actions = angular.copy(columns[columns.length - 1]);
    const newColumns = columns.slice(0, 3);

    const header = {
      type : 'number',
      enableFiltering  : false,
      headerCellFilter : 'translate',
      headerCellClass  : 'text-center',
      cellFilter       : 'currency:'.concat(Session.enterprise.currency_id),
      cellClass        : 'text-right',
      footerCellClass  : 'text-right',
      footerCellFilter : 'currency:'.concat(Session.enterprise.currency_id),
      aggregationType : customAggregationFn,
      aggregationHideLabel : true,
    };

    year.periods.forEach((p, index) => {
      newColumns.push(angular.extend({}, header, {
        field            : `balance${index}`,
        displayName      : p.translate_key || 'FORM.LABELS.OPENING_BALANCE',
      }));
    });

    vm.gridOptions.columnDefs = [...newColumns, actions];
    vm.displayNames = columnConfig.getDisplayNames();
  }

  // fired when the footer changes and on startup.
  /**
   *
   * @param year
   */
  function onSelectFiscalYear(year) {
    vm.year = year;
    vm.fiscalYearLabel = vm.year.label;

    vm.filters = {
      fiscal_year_id : vm.year.id,
    };

    load(vm.filters);
  }

  // runs on startup
  /**
   *
   */
  function startup() {
    // TODO(@jniles) - cache this date
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
