angular.module('bhima.controllers')
  .controller('FiscalOpeningBalanceController', FiscalOpeningBalanceController);

FiscalOpeningBalanceController.$inject = [
  '$state', 'FiscalService', 'NotifyService', 'uiGridConstants',
  'SessionService', 'bhConstants', 'TreeService', 'GridExportService',
];

/**
 * @param $state
 * @param Fiscal
 * @param Notify
 * @param uiGridConstants
 * @param Session
 * @param bhConstants
 * @param Tree
 * @param GridExport
 * @function FiscalOpeningBalanceController
 * @description
 * This controller allows a user to set the opening balance of a fiscal year.
 * A fiscal year's opening balance is set in two ways:
 *  1) If there is a previous fiscal year, the ending balance of that fiscal
 *    year is automatically imported as the beginning balance of the next year.
 *  2) If there is no previous fiscal year, it means that this is the first year
 *    ever created.  A user can manually define the opening balances.
 */
function FiscalOpeningBalanceController($state, Fiscal, Notify, uiGridConstants,
  Session, bhConstants, Tree, GridExport) {
  const vm = this;
  const fiscalYearId = $state.params.id;

  // expose to the view
  vm.enterprise = Session.enterprise;
  vm.editBalanceEnabled = true;
  vm.showAccountFilter = false;
  vm.toggleAccountFilter = toggleAccountFilter;
  vm.submit = submit;
  vm.onBalanceChange = onBalanceChange;

  // grid options
  vm.indentTitleSpace = 15;
  vm.gridApi = {};

  /**
   *
   * @param grid
   * @param row
   */
  function computeBoldClass(grid, row) {
    const boldness = row.entity.isTitleAccount ? 'text-bold' : '';
    return `text-right ${boldness}`;
  }

  /**
   *
   * @param columnDefs
   * @param column
   */
  function customAggregationFn(columnDefs, column) {
    if (vm.AccountTree) {
      const root = vm.AccountTree.getRootNode();
      return (root[column.field] || 0);
    }

    return 0;
  }

  const columns = [{
    field : 'number',
    displayName : 'ACCOUNT.LABEL',
    headerCellFilter : 'translate',
    cellClass : computeBoldClass,
    width : 100,
  }, {
    field : 'label',
    displayName : 'FORM.LABELS.ACCOUNT',
    cellTemplate : '/modules/accounts/templates/grid.labelCell.tmpl.html',
    headerCellFilter : 'translate',
    enableFiltering : true,
  }, {
    field : 'debit',
    displayName : 'FORM.LABELS.DEBIT',
    headerCellClass : 'text-center',
    headerCellFilter : 'translate',
    type : 'number',
    cellTemplate : '/modules/fiscal/templates/balance.debit.tmpl.html',
    aggregationHideLabel : true,
    aggregationType  : customAggregationFn,
    footerCellClass  : 'text-right',
    footerCellFilter : 'currency:'.concat(Session.enterprise.currency_id),
    width : 200,
    enableFiltering : false,
  }, {
    field : 'credit',
    displayName : 'FORM.LABELS.CREDIT',
    headerCellClass : 'text-center',
    headerCellFilter : 'translate',
    type : 'number',
    cellTemplate : '/modules/fiscal/templates/balance.credit.tmpl.html',
    aggregationHideLabel : true,
    aggregationType  : customAggregationFn,
    footerCellClass  : 'text-right',
    footerCellFilter : 'currency:'.concat(Session.enterprise.currency_id),
    width : 200,
    enableFiltering : false,
  }];

  vm.gridOptions = {
    appScopeProvider : vm,
    fastWatch : true,
    flatEntityAccess : true,
    enableSorting : false,
    enableColumnMenus : false,
    enableFiltering : vm.showAccountFilter,
    showColumnFooter  : true,
    columnDefs : columns,
    onRegisterApi,
  };

  const exporter = new GridExport(vm.gridOptions, 'all', 'visible');

  /**
   *
   * @param rows
   */
  function exportRowsFormatter(rows) {
    return rows
      .filter(account => !account.isTitleAccount)
      .map(account => {
        const row = [account.number, account.label, account.debit, account.credit];
        return row.map(value => ({ value }));
      });
  }

  vm.export = () => {
    const fname = `${vm.fiscal.label}`;
    return exporter.exportToCsv(fname, exporter.defaultColumnFormatter, exportRowsFormatter);
  };

  startup();

  // API register function
  /**
   *
   * @param gridApi
   */
  function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  }

  // load the fiscal year and beginning balance
  /**
   *
   */
  function startup() {
    Fiscal.read(fiscalYearId)
      .then(fy => {
        vm.fiscal = fy;
        $state.params.label = vm.fiscal.label;
        return fy.previous_fiscal_year_id;
      })
      .then(hasPrevious)
      .then(loadOpeningBalance)
      .catch(Notify.handleError);
  }

  /**
   * @param tree
   * @function pruneUntilSettled
   * @description
   * Tree shaking algorithm that prunes the tree until only accounts with
   * children remain in the tree.  Highly inefficient!  But this operation
   * doesn't happen that frequently.
   *
   * In practice, the prune function is called 0 - 5 times, depending on how
   * many title accounts are missing children.
   */
  function pruneUntilSettled(tree) {
    const pruneFn = node => node.isTitleAccount && node.children.length === 0;

    let settled = tree.prune(pruneFn);
    while (settled > 0) {
      settled = tree.prune(pruneFn);
    }
  }

  /**
   * @function loadOpeningBalance
   * @description
   * Populates the initial opening balance from the server.
   * @param {boolean} showHiddenAccounts show or hide hidden accounts
   * @todo hide all pcgc accounts or duplicated accounts
   */
  function loadOpeningBalance(showHiddenAccounts) {
    return Fiscal.getOpeningBalance(fiscalYearId)
      .then(data => {
        let accounts = data;

        if (!showHiddenAccounts) {
          accounts = accounts.filter(account => account.hidden !== 1);
        }

        vm.AccountTree = new Tree(accounts);

        // compute properties for rendering pretty indented templates
        vm.AccountTree.walk((child, parent) => {
          child.isTitleAccount = child.type_id === bhConstants.accounts.TITLE;
          child.$$treeLevel = (parent.$$treeLevel || 0) + 1;
        });

        // prune all title accounts with empty children
        pruneUntilSettled(vm.AccountTree);

        // compute balances
        vm.balanced = hasBalancedAccount();
        onBalanceChange();

        vm.gridOptions.data = vm.AccountTree.data;
      });
  }

  /**
   * @function submit
   * @description
   * Record changes to the opening balance of the fiscal year.
   */
  function submit() {
    vm.balanced = hasBalancedAccount();

    if (!vm.previousFiscalYearExist && !vm.balanced) {
      Notify.danger('ACCOUNT.NOT_BALANCED');
      return;
    }

    // trim the accounts list for submission to the server
    const accounts = vm.AccountTree.toArray()
      .filter(account => !account.isTitleAccount)
      .map(account => ({
        id : account.id,
        debit : account.debit,
        credit : account.credit,
      }));

    // set the fiscal year opening balance
    Fiscal.setOpeningBalance({
      id : fiscalYearId,
      fiscal : vm.fiscal,
      accounts,
    })
      .then(() => {
        Notify.success(vm.previousFiscalYearExist ? 'FORM.INFO.IMPORT_SUCCESS' : 'FORM.INFO.SAVE_SUCCESS');
        startup();
      })
      .catch(Notify.handleError);
  }

  /**
   * @function toggleAccountFilter
   * @description
   * Enable or disable the account filter.
   */
  function toggleAccountFilter() {
    vm.showAccountFilter = !vm.showAccountFilter;
    vm.gridOptions.enableFiltering = vm.showAccountFilter;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);
  }

  /**
   * @function hasBalancedAccount
   * @description
   * Checks if the debits and credits balance
   */
  function hasBalancedAccount() {
    const { debit, credit } = vm.AccountTree.getRootNode();
    return debit === credit;
  }

  /**
   * @param previousFiscalYearId
   * @function hasPrevious
   * @description
   * Check if the previous fiscal year exists for this fiscal year
   */
  function hasPrevious(previousFiscalYearId) {
    if (!previousFiscalYearId) { return false; }
    return Fiscal.read(previousFiscalYearId)
      .then(fiscalYear => {
        vm.previousFiscalYearExist = !!fiscalYear.id;
      });
  }

  const debitSumFn = Tree.common.sumOnProperty('debit');
  const creditSumFn = Tree.common.sumOnProperty('credit');

  /**
   * @function onBalanceChange
   * @description
   * This function tells the ui-grid to sum the values of the debit/credit
   * columns in the footer.
   */
  function onBalanceChange() {
    vm.AccountTree.walk((node, parent) => {
      parent.debit = 0;
      parent.credit = 0;
    });

    vm.AccountTree.walk((childNode, parentNode) => {
      debitSumFn(childNode, parentNode);
      creditSumFn(childNode, parentNode);
    }, false);

    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

}
