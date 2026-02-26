angular.module('bhima.controllers')
  .controller('AccountsController', AccountsController);

AccountsController.$inject = [
  '$state', '$rootScope', '$timeout', 'AccountGridService', 'NotifyService', 'bhConstants',
  'LanguageService', 'uiGridConstants', 'ModalService', 'AccountService', 'GeneralLedgerService', 'moment',
];

/**
 * @param $state
 * @param $rootScope
 * @param $timeout
 * @param AccountGrid
 * @param Notify
 * @param Constants
 * @param Language
 * @param uiGridConstants
 * @param Modal
 * @param Accounts
 * @param GeneralLedger
 * @param moment
 * @module AccountsController
 * @todo
 * There are performance issues on this page - this should be because of row/cell templates, investigate
 * @description
 * This controller is responsible for configuring the Accounts Management UI grid
 * and connecting it with the Accounts data model.
 */
function AccountsController(
  $state, $rootScope, $timeout, AccountGrid, Notify, Constants,
  Language, uiGridConstants, Modal, Accounts, GeneralLedger, moment,
) {
  const vm = this;
  const columns = gridColumns();

  vm.Constants = Constants;
  vm.loading = true;

  vm.showHiddenAccounts = false;

  // account title indent value in pixels
  vm.indentTitleSpace = 20;

  // this flag will determine if the grid should expand the rows on data change
  vm.initialDataSet = true;

  // lang parameter for document
  vm.parameter = { lang : Language.key };

  vm.remove = remove;
  vm.toggleHideAccount = toggleHideAccount;
  vm.toggleLockAccount = toggleLockAccount;
  vm.setShowHiddenAccounts = setShowHiddenAccounts;

  vm.Accounts = new AccountGrid();

  /**
   *
   * @param initialLoad
   */
  function init(initialLoad) {
    vm.loading = true;
    vm.Accounts.settup(initialLoad || $state.params.forceReload)
      .then(bindGridData)
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  init();

  vm.gridOptions = {
    appScopeProvider : vm,
    enableSorting : false,
    enableFiltering : false,
    flatEntityAccess : true,
    showTreeExpandNoChildren : false,
    enableColumnMenus : false,
    rowTemplate : '/modules/accounts/templates/grid.leafRow.tmpl.html',
    onRegisterApi : registerAccountEvents,
    columnDefs : columns,
  };

  // because the modal is instantiated on onEnter in the ui-router configuration the
  // $parent $scope for the modal is $rootScope, it is impossible to inject the $scope of the
  // parent state into the onEnter callback. for this reason $rootScope is used for now
  $rootScope.$on('ACCOUNT_CREATED', vm.Accounts.updateViewInsert.bind(vm.Accounts));
  $rootScope.$on('ACCOUNT_UPDATED', handleUpdatedAccount);
  $rootScope.$on('ACCOUNT_IMPORTED', () => init(true));

  /**
   *
   */
  function gridColumns() {
    return [
      {
        field : 'number',
        displayName : '',
        cellClass : 'text-left',
        width : 80,
      },
      {
        field : 'label',
        displayName : 'FORM.LABELS.ACCOUNT',
        cellTemplate : '/modules/accounts/templates/grid.indentCell.tmpl.html',
        headerCellFilter : 'translate',
        cellClass : 'text-left',
      },
      {
        field : 'type',
        displayName : 'FORM.LABELS.TYPE',
        headerCellFilter : 'translate',
        width : 150,
      },
      {
        field : 'cost_center_label',
        displayName : 'COST_CENTER.TITLE',
        headerCellFilter : 'translate',
        width : 180,
      },
      {
        name : 'actions',
        enableFiltering : false,
        displayName : '',
        cellTemplate : '/modules/accounts/templates/actions.html',
        headerCellFilter : 'translate',
        width : 140,
      },
    ];
  }

  /**
   *
   * @param showHiddenAccounts
   */
  function setShowHiddenAccounts(showHiddenAccounts) {
    vm.showHiddenAccounts = showHiddenAccounts;
    vm.Accounts.filterHiddenAccounts(showHiddenAccounts);
  }

  /**
   *
   * @param event
   * @param account
   */
  function handleUpdatedAccount(event, account) {
    const scrollDelay = 200;

    // check to see if the underlying accounts model requires a grid refresh
    // it will return true if it is required
    const forceRefresh = vm.Accounts.updateViewEdit(event, account);

    if (forceRefresh) {
      vm.initialDataSet = true;
      bindGridData();

      // @todo delaying scroll removes a corner case where the grid hasn't yet
      //       fully processed the new data - this should probably follow an event
      $timeout(scrollOnTimeout, scrollDelay);
    }

    /**
     *
     */
    function scrollOnTimeout() {
      scrollTo(account.id);
    }
  }

  // scroll to a row given an account ID
  /**
   *
   * @param accountId
   */
  function scrollTo(accountId) {
    vm.api.core.scrollTo(vm.Accounts.lookup(accountId));
  }

  /**
   *
   * @param api
   */
  function registerAccountEvents(api) {
    vm.api = api;
    api.grid.registerDataChangeCallback(expandOnSetData);
    api.grid.handleWindowResize();
  }

  /**
   *
   * @param grid
   */
  function expandOnSetData(grid) {
    if (vm.initialDataSet && grid.options.data.length) {
      grid.api.treeBase.expandAllRows();
      vm.initialDataSet = false;
    }
  }

  vm.openAccountReport = function openAccountReport(accountId) {
    const opts = {
      account_id : accountId,
      dateFrom : moment().startOf('year').toDate(),
      dateTo : moment().endOf('year').toDate(),
      limit : 1000,
      renderer : 'pdf',
    };

    return GeneralLedger.openAccountReport(opts);
  };

  /**
   * @param id
   * @function remove
   * @description
   * This function will delete an account from the database, provided it isn't
   * used anywhere.
   */
  function remove(id) {
    const account = vm.Accounts.lookup(id);

    Modal.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(bool => {
        // if the user clicked cancel, reset the view and return
        if (!bool || !account) {
          return null;
        }

        return Accounts.delete(account.id)
          .then(() => {
            vm.Accounts.updateViewDelete(null, account);
            Notify.success('ACCOUNT.DELETED');
          })
          .catch(Notify.handleError);
      });
  }

  /**
   *
   */
  function bindGridData() {
    // format view, filtering if necessary
    vm.setShowHiddenAccounts(vm.showHiddenAccounts);

    // bind grid data
    vm.gridOptions.data = vm.Accounts.data;
  }

  /**
   * @param id
   * @function toggleLockAccount
   * @description
   * Switches the "locked" field on the account on and off.  If the account
   * is unlocked, it will ask for express permission to toggle it to locked.
   */
  function toggleLockAccount(id) {
    const account = vm.Accounts.lookup(id);

    const msg = account.locked ? 'ACCOUNT.CONFIRM_UNLOCK' : 'ACCOUNT.CONFIRM_LOCK';

    Modal.confirm(msg)
      .then(bool => {
        if (bool) {
          Accounts.update(id, { locked : !account.locked })
            .then(() => {
              account.locked = !account.locked;
              vm.Accounts.updateViewEdit(null, account);
            });
        }
      });
  }

  /**
   * @param id
   * @function toggleHideAccount
   * @description
   * Switches the "hidden" field on accounts on or off.  If the account is not
   * hidden, it will ask for confirmation before the toggle.
   */
  function toggleHideAccount(id) {
    const account = vm.Accounts.lookup(id);

    const msg = account.hidden ? 'ACCOUNT.CONFIRM_UNHIDE' : 'ACCOUNT.CONFIRM_HIDE';

    Modal.confirm(msg)
      .then(bool => {
        if (bool) {
          Accounts.update(id, { hidden : !account.hidden })
            .then(() => {
              account.hidden = !account.hidden;
              vm.Accounts.updateViewEdit(null, account);

              // re-filter view
              setShowHiddenAccounts(vm.showHiddenAccounts);
            });
        }
      });
  }

  /**
   * @function toggleInlineFilter
   * @description
   * Switches the inline filter on and off.
   */
  vm.toggleInlineFilter = function toggleInlineFilter() {
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.api.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  };
}
