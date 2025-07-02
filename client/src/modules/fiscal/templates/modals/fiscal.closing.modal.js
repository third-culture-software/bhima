angular.module('bhima.controllers')
  .controller('ClosingFiscalYearModalController', ClosingFYModalCtrl);

// dependencies injection
ClosingFYModalCtrl.$inject = [
  'NotifyService', 'FiscalService', 'ModalService', 'SessionService',
  '$uibModalInstance', 'data', 'uiGridConstants',
  'bhConstants', 'TreeService', 'AccountService',
];

// The closing fiscal year controller
function ClosingFYModalCtrl(
  Notify, Fiscal, Modal, Session, Instance, Data,
  uiGridConstants, bhConstants, Tree, Accounts,
) {
  const vm = this;
  const fiscalYearId = Data.id;

  vm.currency_id = Session.enterprise.currency_id;

  // expose to the view
  vm.cancel = Instance.close;
  vm.stepForward = stepForward;
  vm.onSelectAccount = onSelectAccount;
  vm.indentTitleSpace = 10;

  const acceptedAccountTypes = [
    bhConstants.accounts.INCOME,
    bhConstants.accounts.EXPENSE,
    bhConstants.accounts.TITLE,
  ];

  function customAggregationFn(columnDefs, column) {
    if (vm.AccountTree) {
      const root = vm.AccountTree.getRootNode();
      return (root[column.field] || 0);
    }

    return 0;
  }

  function computeBoldClass(grid, row) {
    const boldness = row.entity.isTitleAccount ? 'text-bold' : '';
    return `text-right ${boldness}`;
  }

  // exploitation grid
  const columns = [{
    field : 'number',
    displayName : 'ACCOUNT.NUMBER',
    headerCellFilter : 'translate',
    cellClass : computeBoldClass,
    sort : {
      direction : 'asc',
      priority : 0,
    },
  }, {
    field : 'label',
    displayName : 'TABLE.COLUMNS.ACCOUNT',
    cellTemplate : '/modules/accounts/templates/grid.labelCell.tmpl.html',
    headerCellFilter : 'translate',
  }, {
    aggregationHideLabel : true,
    aggregationType  : customAggregationFn,
    cellClass : computeBoldClass,
    cellFilter : 'currency:'.concat(Session.enterprise.currency_id),
    displayName : 'TABLE.COLUMNS.DEBIT',
    field : 'debit',
    footerCellClass  : 'text-right',
    footerCellFilter : 'currency:'.concat(Session.enterprise.currency_id),
    headerCellFilter : 'translate',
    type : 'number',
  }, {
    aggregationHideLabel : true,
    aggregationType  : customAggregationFn,
    cellClass : computeBoldClass,
    cellFilter : 'currency:'.concat(Session.enterprise.currency_id),
    displayName : 'TABLE.COLUMNS.CREDIT',
    field : 'credit',
    footerCellClass  : 'text-right',
    footerCellFilter : 'currency:'.concat(Session.enterprise.currency_id),
    headerCellFilter : 'translate',
    type : 'number',
  }];

  vm.gridOptions = {
    columnDefs : columns,
    enableColumnMenus : false,
    showColumnFooter : true,
    flatEntityAccess : true,
    fastWatch : true,
    enableSorting : true,
    appScopeProvider : vm,
  };

  vm.gridOptions.onRegisterApi = (gridApi) => {
    vm.gridApi = gridApi;
  };

  startup();

  function onSelectAccount(account) {
    vm.resultAccount = account;

    Accounts.getAnnualBalance(vm.resultAccount.id, fiscalYearId)
      .then(response => {
        vm.accountBalance = response;
      })
      .catch(Notify.handleError);
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

  function computeGridTotals() {
    vm.totals = { income : 0, expense : 0 };
    vm.AccountTree.data.reduce((aggregates, node) => {
      const isIncome = (node.type_id === bhConstants.accounts.INCOME);
      const isExpense = (node.type_id === bhConstants.accounts.EXPENSE);

      if (isIncome) {
        aggregates.income += (node.credit - node.debit);
      } else if (isExpense) {
        aggregates.expense += (node.debit - node.credit);
      }

      return aggregates;
    }, vm.totals);

    vm.totals.net = (vm.totals.income - vm.totals.expense);
  }

  function startup() {
    vm.loading = true;

    Fiscal.read(fiscalYearId)
      .then(fiscal => {
        vm.fiscal = fiscal;

        // get balance until period N of the year to close
        return Fiscal.getBalance(fiscalYearId);
      })
      .then(accounts => {
        if (accounts.length === 0) { return; }
        vm.AccountTree = new Tree(accounts);

        // compute properties for rendering pretty indented templates
        vm.AccountTree.walk((child, parent) => {
          child.isTitleAccount = child.type_id === bhConstants.accounts.TITLE;
          child.$$treeLevel = (parent.$$treeLevel || 0) + 1;
        });

        // prune all title accounts with empty children and non income/expense
        // accounts
        pruneUntilSettled(vm.AccountTree);

        // compute balances
        onBalanceChange();

        // prune zero accounts
        const zeroAmountFilter = node => (node.debit + node.credit === 0);
        vm.AccountTree.prune(zeroAmountFilter);

        // sort the accounts by their label
        vm.AccountTree.sort((a, b) => a.number > b.number);

        vm.gridOptions.data = vm.AccountTree.data;

        // compute the totals
        computeGridTotals();
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  function stepForward(form) {
    if (form.$invalid) {
      return;
    }

    if (vm.steps !== 'summary') {
      vm.steps = 'summary';
    } else {
      confirmClosing();
    }
  }

  // confirm closing
  function confirmClosing() {
    const request = {
      pattern : vm.fiscal.label,
      patternName : 'FORM.PATTERNS.FISCAL_YEAR_NAME',
      noText : true,
    };

    return Modal.openConfirmDialog(request)
      .then(ans => {
        if (!ans) {
          return 0;
        }

        return Fiscal.closeFiscalYear(fiscalYearId, {
          account_id : vm.resultAccount.id,
        });
      })
      .then(res => {
        if (!res) {
          return;
        }

        Instance.close(true);
        Notify.success('FISCAL.CLOSING_SUCCESS');
      })
      .catch(err => {
        Instance.close(false);
        Notify.handleError(err);
      });
  }

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
    // if the account type is not in the accepted account types, the node should
    // be filtered out
    const accountTypeFilter = node => !acceptedAccountTypes.includes(node.type_id);
    const emptyTitleAccountFilter = node => (node.isTitleAccount && node.children.length === 0);

    const pruneFn = node => emptyTitleAccountFilter(node)
      || accountTypeFilter(node);

    let settled = tree.prune(pruneFn);
    while (settled > 0) {
      settled = tree.prune(pruneFn);
    }
  }
}
