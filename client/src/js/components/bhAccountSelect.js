// This module contains two components: bhAccountSelect and bhAccountSelectMultiple.

angular.module('bhima.components')
  .component('bhAccountSelect', {
    templateUrl : 'modules/templates/bhAccountSelect.tmpl.html',
    controller  : AccountSelectController,
    transclude  : true,
    bindings    : {
      accountId        : '<',
      onSelectCallback : '&',
      disable          : '<?',
      required         : '<?',
      accountTypeId    : '<?',
      label            : '@?',
      name             : '@?',
      excludeTitleAccounts : '@?',
    },
  });

angular.module('bhima.components')
  .component('bhAccountSelectMultiple', {
    templateUrl : 'modules/templates/bhAccountSelectMultiple.tmpl.html',
    controller  : AccountSelectController,
    transclude  : true,
    bindings    : {
      accountIds       : '<',
      onSelectCallback : '&',
      onChange         : '&',
      required         : '<?',
      accountTypeId    : '<?',
      label            : '@?',
      excludeTitleAccounts : '@?',
    },
  });

AccountSelectController.$inject = [
  'AccountService', 'FormatTreeDataService', 'bhConstants', '$scope', '$timeout',
];

/**
 * Shared account selection controller (single + multiple select)
 * @param Accounts
 * @param FormatTreeData
 * @param bhConstants
 * @param $scope
 * @param $timeout
 */
function AccountSelectController(Accounts, FormatTreeData, bhConstants, $scope, $timeout) {
  const $ctrl = this;
  const TITLE_ACCOUNT_TYPE_ID = bhConstants.accounts.TITLE;

  // fired at the beginning of the account select
  $ctrl.$onInit = function $onInit() {
    // default for form name (only meaningful for bhAccountSelect, harmless otherwise)
    $ctrl.name = $ctrl.name || 'AccountForm';

    // cache the title account ID for convenience
    $ctrl.TITLE_ACCOUNT_ID = bhConstants.accounts.TITLE;

    // translated label for the form input
    $ctrl.label = $ctrl.label || 'FORM.LABELS.ACCOUNT';

    // used to disable title accounts in the select list (bhAccountSelectMultiple)
    $ctrl.disableTitleAccounts = angular.isDefined($ctrl.disableTitleAccounts)
      ? $ctrl.disableTitleAccounts : true;

    if (!angular.isDefined($ctrl.required)) {
      $ctrl.required = true;
    }

    $ctrl.excludeTitleAccounts = angular.isDefined($ctrl.excludeTitleAccounts)
      ? $ctrl.excludeTitleAccounts : true;

    // alias the name as AccountForm
    $timeout(aliasComponentForm);

    // load accounts
    return loadHttpAccounts();
  };

  // this makes the HTML much more readable by referencing AccountForm instead of the name
  /**
   *
   */
  function aliasComponentForm() {
    $scope.AccountForm = $scope[$ctrl.name];
  }

  /**
   * @param types
   * @function parseAccountTypeIds
   * @description
   * Parses the account type id binding whether it is a string, number, or array and returns
   * an array of integers. Also adds in the title account no matter what to the account type
   * array shipped to the server so that we can always build a tree.
   */
  function parseAccountTypeIds(types) {
    let parsed;
    if (Array.isArray(types)) {
      parsed = types.map(type => parseInt(type, 10));
    } else if (typeof types === 'string') {
      parsed = types.split(',')
        .filter(type => type !== '')
        .map(type => parseInt(type, 10));
    } else if (typeof types === 'number') {
      parsed = [types];
    } else {
      throw new Error('Cannot parse account types from '.concat(types));
    }
    return [TITLE_ACCOUNT_TYPE_ID, ...parsed];
  }

  /**
   * @description
   * Load the accounts from the server.
   */
  function loadHttpAccounts() {
    const params = { hidden : 0 };

    if ($ctrl.accountTypeId) {
      params.detailed = 1;
      params.type_id = parseAccountTypeIds($ctrl.accountTypeId);
    } else {
      params.detailed = 0;
    }

    return Accounts.read(null, params)
      .then(elements => {
        let accounts = FormatTreeData.order(elements);
        if ($ctrl.excludeTitleAccounts) {
          accounts = Accounts.filterTitleAccounts(accounts);
        }
        $ctrl.accounts = accounts;
      });
  }

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = function onSelect(account) {
    $ctrl.onSelectCallback({ account });

    // alias the AccountForm name so that we can find it via filterFormElements
    // (only applies when a form control named $ctrl.name actually exists, i.e. bhAccountSelect)
    if ($scope[$ctrl.name]) {
      $scope[$ctrl.name].$bhValue = account.id;
    }
  };

  // fires the onChange bound to the component boundary (only used by bhAccountSelectMultiple)
  $ctrl.handleChange = (id) => $ctrl.onChange({ id });
}
