angular.module('bhima.components')
  .component('bhAccountSelectMultiple', {
    templateUrl : 'modules/templates/bhAccountSelectMultiple.tmpl.html',
    controller  : AccountSelectController,
    transclude  : true,
    bindings    : {
      accountIds       : '<',
      onSelectCallback : '&',
      onChange    : '&',
      required         : '<?',
      accountTypeId    : '<?',
      label            : '@?',
      excludeTitleAccounts : '@?',
    },
  });

AccountSelectController.$inject = [
  'AccountService', 'FormatTreeDataService', 'bhConstants',
];

/**
 * Account selection component
 * @param Accounts
 * @param FormatTreeData
 * @param bhConstants
 */
function AccountSelectController(Accounts, FormatTreeData, bhConstants) {
  const $ctrl = this;

  // fired at the beginning of the account select
  $ctrl.$onInit = function $onInit() {

    // cache the title account ID for convenience
    $ctrl.TITLE_ACCOUNT_ID = bhConstants.accounts.TITLE;

    // translated label for the form input
    $ctrl.label = $ctrl.label || 'FORM.LABELS.ACCOUNT';

    // used to disable title accounts in the select list
    $ctrl.disableTitleAccounts = angular.isDefined($ctrl.disableTitleAccounts)
      ? $ctrl.disableTitleAccounts : true;

    if (!angular.isDefined($ctrl.required)) {
      $ctrl.required = true;
    }

    $ctrl.excludeTitleAccounts = angular.isDefined($ctrl.excludeTitleAccounts)
      ? $ctrl.excludeTitleAccounts : true;

    // load accounts
    loadHttpAccounts();
  };

  // loads accounts from the server
  /**
   *
   */
  function loadHttpAccounts() {
    const detail = $ctrl.accountTypeId;
    const detailed = detail ? 1 : 0;
    const params = { detailed };

    if ($ctrl.accountTypeId) {
      params.type_id = $ctrl.accountTypeId
        .split(',')
        .map(num => parseInt(num, 10));
    }

    // NOTE: this will hide all "hidden" accounts
    params.hidden = 0;

    // load accounts
    Accounts.read(null, params)
      .then(elements => {
        // bind the accounts to the controller
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
  };

  // fires the onChange bound to the component boundary
  $ctrl.handleChange = (id) => $ctrl.onChange({ id });
}
