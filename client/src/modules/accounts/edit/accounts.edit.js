angular.module('bhima.controllers')
  .controller('AccountEditController', AccountEditController);

AccountEditController.$inject = [
  '$rootScope', '$state', 'AccountStoreService', 'AccountService',
  'NotifyService', 'util', 'bhConstants', 'appcache', 'params',
];

/**
 *
 * @param $rootScope
 * @param $state
 * @param AccountStore
 * @param Accounts
 * @param Notify
 * @param util
 * @param Constants
 * @param AppCache
 * @param params
 */
function AccountEditController(
  $rootScope, $state, AccountStore, Accounts,
  Notify, util, Constants, AppCache, params,
) {
  const cache = AppCache('AccountEdit');
  const vm = this;

  vm.stateParams = {};
  vm.isCreateState = params.isCreateState;

  if (params.id || vm.isCreateState) {
    cache.stateParams = params;
    vm.stateParams = cache.stateParams;
  } else {
    vm.stateParams = cache.stateParams;
  }

  const { id, parentId } = vm.stateParams;

  let accountStore;
  let typeStore;

  vm.Constants = Constants;

  // expose utility methods
  vm.setRootAccount = setRootAccount;
  vm.updateAccount = updateAccount;
  vm.getTypeTitle = getTypeTitle;
  vm.close = close;

  vm.batchCreate = false;
  vm.account = null;

  // variables to track custom modal error handling, these will be replaced
  // with either the Notification library or a uniform modal error handling utility
  vm.fetchError = null;
  vm.accountNotFound = null;

  vm.rootAccount = {
    id : 0,
    number : 0,
    type_id : Constants.accounts.TITLE,
    label : 'ROOT ACCOUNT',
  };
  vm.rootAccount.hrlabel = Accounts.label(vm.rootAccount);

  /** @todo design how these are served for stores */
  vm.notFound = {
    status : 404,
    code : 'ERRORS.NOT_FOUND',
  };

  setupPage()
    .then(setAccount);

  vm.onCostCenterSelect = cc => {
    vm.account.cost_center_id = cc.id;
  };

  /**
   * @function setupPage
   * @description
   * Initialise required variables and fetch initial stores for udpating/ creating
   * accounts.
   */
  function setupPage() {
    return AccountStore.accounts()
      .then(handleAccountStore)
      .then(handleAccountType);
  }

  /**
   *
   * @param accounts
   */
  function handleAccountStore(accounts) {
    accountStore = angular.copy(accounts);
    accountStore.post(vm.rootAccount);
    vm.accounts = accountStore.data.filter(item => item.id !== parseInt(id, 10));
    return AccountStore.types();
  }

  /**
   *
   * @param types
   */
  function handleAccountType(types) {
    typeStore = types;
    vm.types = typeStore.data;
  }

  /**
   * @fixme
   * account store is not updated on creation or update
   */
  function setAccount() {
    vm.showCostCenterSelect = !!vm.isCreateState;

    if (angular.isDefined(id)) {
      // account has been specified; set up updating this account
      loadAccountDetails(id);
    } else {
      // no account specified - a new account will be created
      defineNewAccount();
    }
  }

  /**
   *
   * @param typeId
   */
  function checkExploitationAccount(typeId) {
    const isExpense = typeId === Constants.accounts.EXPENSE;
    const isIncome = typeId === Constants.accounts.INCOME;
    return !!(isExpense || isIncome);
  }

  /**
   *
   * @param accountId
   */
  function loadAccountDetails(accountId) {
    // load in the account details
    const account = accountStore.get(accountId);

    // if no account is found either the store is out of date or a bad reference
    // has been passed
    if (!account) {
      mockAccountNotFound();
      return;
    }

    vm.account = angular.copy(account);
    const accountParentId = vm.account.parent.id || vm.account.parent;
    vm.account.parent = accountStore.get(accountParentId);

    // show cost center select only for income or expense accounts
    vm.showCostCenterSelect = checkExploitationAccount(vm.account.type_id);

    // cast to string to match type options
    vm.account.type_id = String(vm.account.type_id);
  }

  /**
   *
   */
  function defineNewAccount() {
    // defining a new account
    // if a previous account existed - use these settings for the next account (batch creation)
    let cacheType;
    let cacheParent;

    if (vm.account) {
      cacheType = vm.account.type_id;
      cacheParent = vm.account.parent.id;
    }

    vm.account = {};

    // default parent -check to see if there is a requested parent ID has been passed in
    if (parentId) {
      vm.account.parent = accountStore.get(parentId);
    } else {
      // set root account
      vm.account.parent = accountStore.get(cacheParent) || accountStore.get(vm.rootAccount.id);
    }

    // default type
    vm.account.type_id = cacheType || null;
  }

  vm.titleChangedValidation = titleChangedValidation;

  // @todo form validation using validators on a component
  /**
   *
   * @param newAccountType
   */
  function titleChangedValidation(newAccountType) {
    const notTitleAccount = Number(newAccountType) !== Constants.accounts.TITLE;
    const hasChildren = vm.account.children && vm.account.children.length;

    if (notTitleAccount && hasChildren) {
      vm.invalidTitleAccount = true;
    } else {
      vm.invalidTitleAccount = false;
    }
  }

  /**
   * @param accountForm
   * @todo re-factor method - potentially these two actions should be split into two controllers
   */
  function updateAccount(accountForm) {
    // only require form to have changed if this is not the create state (no initial values)
    const requireDirty = !vm.isCreateState;
    accountForm.$setSubmitted();

    if (accountForm.$invalid) {
      return;
    }
    if (accountForm.$pristine) {
      return;
    }

    if (vm.invalidTitleAccount) {
      return;
    }

    const number = parseInt(vm.account.number, 10);
    if (number === 0) {
      Notify.danger('ACCOUNT.NOT_0_AS_ACCOUNT_NOMBER');
      return;
    }

    // this will return all elements if requireDirty is set to false
    const submit = util.filterFormElements(accountForm, requireDirty);

    // handle cost center
    if (vm.account.cost_center_id) {
      submit.cost_center_id = vm.account.cost_center_id;
    }

    // filter parent
    if (submit.parent) {
      submit.parent = vm.account.parent.id;
    }

    if (vm.isCreateState) {
      handleAccountCreateState();
    } else {
      handleAccountUpdateState();
    }

    /**
     *
     */
    function handleAccountCreateState() {
      // This option allows you to display the account type during account creation.
      vm.types.forEach(element => {
        if (element.id === parseInt(submit.type_id, 10)) {
          submit.type = element.type;
        }
      });

      const isExploitation = checkExploitationAccount(+submit.type_id);
      submit.cost_center_id = isExploitation ? submit.cost_center_id : undefined;

      return Accounts.create(submit)
        .then(handleAccountCreateResult)
        .catch(handleModalError);
    }

    /**
     *
     * @param result
     */
    function handleAccountCreateResult(result) {
      vm.fetchError = null;

      // update the id so this account can be directly edited
      submit.id = result.id;
      $rootScope.$broadcast('ACCOUNT_CREATED', submit);
      Notify.success('ACCOUNT.CREATED');

      if (vm.batchCreate) {
        resetModal(accountForm);
      } else {
        close();
      }
    }

    /**
     *
     */
    function handleAccountUpdateState() {
      return Accounts.update(vm.account.id, submit)
        .then(handleAccountUpdateResult)
        .catch(handleModalError);
    }

    /**
     *
     * @param result
     */
    function handleAccountUpdateResult(result) {
      vm.fetchError = null;
      $rootScope.$broadcast('ACCOUNT_UPDATED', result);
      Notify.success('ACCOUNT.UPDATED');
      close();
    }
  }

  /**
   *
   * @param accountForm
   */
  function resetModal(accountForm) {
    accountForm.$setPristine();
    accountForm.$setUntouched();
    setupPage()
      .then(setAccount);
  }

  /**
   *
   * @param typeId
   */
  function getTypeTitle(typeId) {
    if (!typeStore) {
      return null;
    }

    return typeStore.get(typeId).translation_key;
  }

  /**
   *
   * @param accountForm
   */
  function setRootAccount(accountForm) {
    accountForm.parent.$setDirty();
    vm.account.parent = accountStore.get(vm.rootAccount.id);
  }

  /**
   *
   */
  function close() {
    // transition to the overall UI grid state - this modal will be cleaned up on state change
    $state.go('accounts.list');
  }

  /**
   * @function mockAccountNotFound
   * @description
   * This method mocks a 404 returned from the database - if this becomes a common
   * pattern on the client this could be handled and returned from the store
   */
  function mockAccountNotFound() {
    const error = new Error();
    error.data = vm.notFound;
    vm.accountNotFound = error.data;
    throw error;
  }

  // simply exposes the error to the view
  /**
   *
   * @param error
   */
  function handleModalError(error) {
    vm.fetchError = error;
  }
}
