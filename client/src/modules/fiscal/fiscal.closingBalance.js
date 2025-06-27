angular.module('bhima.controllers')
  .controller('FiscalClosingBalanceController', FiscalClosingBalanceController);

FiscalClosingBalanceController.$inject = [
  '$state', 'AccountService', 'FiscalService', 'NotifyService', 'SessionService',
  'uiGridConstants', 'bhConstants', 'TreeService', 'GridExportService',
];

/**
 * @function FiscalClosingBalanceController
 *
 * @description
 * This controller is responsible for handling the closing balance of a fiscal year.
 */
function FiscalClosingBalanceController(
  $state, Accounts, Fiscal, Notify, Session, uiGridConstants, bhConstants,
  Tree, GridExport,
) {

  const vm = this;
  const fiscalYearId = $state.params.id;
  vm.currency_id = Session.enterprise.currency_id;

  // expose to the view
  vm.showAccountFilter = false;
  vm.toggleAccountFilter = toggleAccountFilter;
  // grid options
  vm.indentTitleSpace = 15;
  vm.gridApi = {};

  const columns = [{
    field : 'number',
    displayName : 'ACCOUNT.LABEL',
    cellClass : 'text-right',
    headerCellFilter : 'translate',
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
    cellTemplate : '/modules/fiscal/templates/debit.tmpl.html',
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
    cellTemplate : '/modules/fiscal/templates/credit.tmpl.html',
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
    showColumnFooter : true,
    enableColumnMenus : false,
    enableFiltering : vm.showAccountFilter,
    columnDefs : columns,
    onRegisterApi,
  };

  const exporter = new GridExport(vm.gridOptions, 'all', 'visible');

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

  function customAggregationFn(columnDefs, column) {
    if (vm.AccountTree) {
      const root = vm.AccountTree.getRootNode();
      return (root[column.field] || 0);
    }

    return 0;
  }

  // API register function
  function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  }

  // get fiscal year
  Fiscal.read(fiscalYearId)
    .then((fy) => {
      vm.fiscal = fy;
      $state.params.label = vm.fiscal.label;
      return fy.previous_fiscal_year_id;
    })
    .then(loadFinalBalance)
    .catch(Notify.handleError);

  /**
   * @function pruneUntilSettled
   *
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

  const debitSumFn = Tree.common.sumOnProperty('debit');
  const creditSumFn = Tree.common.sumOnProperty('credit');

  /**
   * @function onBalanceChange
   *
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

  /**
   * @function hasBalancedAccount
   *
   * @description
   * Checks if the debits and credits balance
   */
  function hasBalancedAccount() {
    const { debit, credit } = vm.AccountTree.getRootNode();
    return debit === credit;
  }

  /**
   * @method loadFinalBalance
   *
   * @description
   * Load the balance until a given period.
   */
  function loadFinalBalance(showHiddenAccounts) {
    vm.loading = true;
    vm.hasError = false;
    Fiscal.getClosingBalance(fiscalYearId)
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
      })
      .catch(err => {
        vm.hasError = true;
        Notify.handleError(err);
      })
      .finally(() => {
        vm.loading = false;
      });
  }

  /**
   * @function toggleAccountFilter
   * @description show a filter for finding an account
   */
  function toggleAccountFilter() {
    vm.showAccountFilter = !vm.showAccountFilter;
    vm.gridOptions.enableFiltering = vm.showAccountFilter;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);
  }
}
