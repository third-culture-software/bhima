angular.module('bhima.components')
  .component('bhAccountTypeaheadInline', {
    templateUrl : 'modules/templates/bhAccountTypeaheadInline.html',
    controller  : AccountTypeaheadInlineController,
    bindings    : {
      accountId        : '<',
      onSelectCallback : '&',
      name             : '@?',
    },
  });

AccountTypeaheadInlineController.$inject = [
  'AccountService', '$timeout', '$scope', 'Store', 'FormatTreeDataService',
];

/**
 * Inline Account Typeahead
 *
 * This component is much more limited in options compared to the bhAccountSelect.
 * It is intended to be used in ui-grids to facilitate entering accounts easily
 * without having a heavy uiSelect component.
 * @param Accounts
 * @param $timeout
 * @param $scope
 * @param Store
 * @param FormatTreeData
 */
function AccountTypeaheadInlineController(Accounts, $timeout, $scope, Store, FormatTreeData) {
  const $ctrl = this;
  const store = new Store();

  // fired at the beginning of the account select
  $ctrl.$onInit = function $onInit() {
    // default for form name
    $ctrl.name = $ctrl.name || 'AccountForm';

    // load accounts
    loadAccounts();

    // alias the name as AccountForm
    $timeout(aliasComponentForm);
  };

  // this makes the HTML much more readable by reference AccountForm instead of the name
  /**
   *
   */
  function aliasComponentForm() {
    $scope.AccountForm = $scope[$ctrl.name];
  }

  // loads accounts from the server
  /**
   *
   */
  function loadAccounts() {
    // NOTE: this will hide all "hidden" accounts
    const params = { hidden : 0 };

    Accounts.read(null, params)
      .then(elements => {
        // bind the accounts to the controller
        const accounts = FormatTreeData.order(elements);
        $ctrl.accounts = Accounts.filterTitleAccounts(accounts);

        store.setData($ctrl.accounts);

        if ($ctrl.accountId) {
          setAccount($ctrl.accountId);
        }
      });
  }

  $ctrl.$onChanges = function $onChanges(changes) {
    const accountId = changes.accountId && changes.accountId.currentValue;
    if (accountId) {
      setAccount(accountId);
    }
  };

  /**
   *
   * @param id
   */
  function setAccount(id) {
    $ctrl.account = store.get(id);
  }

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = function onSelect($item) {
    $ctrl.onSelectCallback({ accountId : $item.id });

    // alias the AccountForm name so that we can find it via filterFormElements
    $scope[$ctrl.name].$bhValue = $item.id;
  };
}
