angular.module('bhima.components')
  .component('bhAccountConfigSelect', {
    templateUrl : 'modules/templates/bhAccountConfigSelect.tmpl.html',
    controller  : AccountConfigSelectController,
    transclude  : true,
    bindings    : {
      configAccountingId : '<',
      onSelectCallback : '&',
      required         : '<?',
      label            : '@?',
    },
  });

AccountConfigSelectController.$inject = [
  'ConfigurationAccountService', 'NotifyService',
];

/**
 * Account Configuration Select Controller
 * @param AccountConfig
 * @param Notify
 */
function AccountConfigSelectController(AccountConfig, Notify) {
  const $ctrl = this;

  // fired at the beginning of the account configuration select
  $ctrl.$onInit = function $onInit() {
    // translated label for the form input
    $ctrl.label = $ctrl.label || 'FORM.LABELS.ACCOUNT_CONFIGURATION';

    if (!angular.isDefined($ctrl.required)) {
      $ctrl.required = true;
    }

    $ctrl.isLoading = true;

    AccountConfig.read()
      .then(accountConfigs => {
        $ctrl.accountConfigs = accountConfigs;
      })
      .catch(Notify.handleError)
      .finally(() => {
        $ctrl.isLoading = false;
      });
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = accountConfig => {
    $ctrl.onSelectCallback({ accountConfig });
  };
}
