angular.module('bhima.controllers')
  .controller('DebtorGroupCreateController', DebtorGroupCreateController);

DebtorGroupCreateController.$inject = [
  '$state', 'ScrollService', 'SessionService',
  'DebtorGroupService', 'AccountService', 'PriceListService',
  'uuid', 'NotifyService', 'ColorService',
];

/**
 * This controller is responsible for creating a debtor group. It provides
 * utility functions for submission and error handling.
 *
 * @todo refactor code to remove redundant features introduced previously
 *
 * @module debtor/groups/create
 */

function DebtorGroupCreateController(
  $state, ScrollTo, Session, DebtorGroups,
  Accounts, Prices, Uuid, Notify, Color,
) {
  const vm = this;

  // default new group policies
  const policies = {
    subsidies       : true,
    discounts       : true,
    invoicingFees : false,
  };

  vm.colors = Color.list;

  vm.$loading = true;
  vm.$loaded = false;

  vm.onSelectAccountCallback = onSelectAccount;
  vm.cancel = cancel;

  /* @todo This controller should not be concerned about individual price lists */
  Prices.read()
    .then((priceLists) => {
      vm.priceLists = priceLists;
      vm.$loaded = true;
    })
    .catch(Notify.handleError)
    .finally(() => {
      vm.$loading = false;
    });

  // expose state for optional view elements
  vm.state = $state;

  setupDefaults();

  function setupDefaults() {
    vm.createSessionId = Uuid();

    /* object to collect all form model values */
    vm.group = {};
    vm.group.uuid = vm.createSessionId;

    // set default values
    vm.group.location_id = Session.enterprise.location_id;

    // assigning policy logic
    vm.group.apply_discounts = policies.subsidies;
    vm.group.apply_subsidies = policies.discounts;
    vm.group.apply_invoicing_fees = !policies.invoicingFees;

    vm.group.max_debt = 0;
    vm.submit = submit;
  }

  // attached the account as needed
  function onSelectAccount(account) {
    vm.group.account_id = account.id;
  }

  function cancel() {
    $state.go('debtorGroups.list');
  }

  function submit(groupForm) {

    groupForm.$setSubmitted();

    // ensure all Angular form validation checks have passed
    if (groupForm.$invalid) {
      Notify.danger('FORM.ERRORS.RECORD_ERROR');
      return;
    }

    // in order to display account correctly the entire account is stored in the
    // ng-model, we should extract this
    const submitGroup = angular.copy(vm.group);

    DebtorGroups.create(submitGroup)
      .then(() => {
        Notify.success('DEBTOR_GROUP.CREATED');

        // Debtor group created
        if (vm.resetOnCompletion) {

          // reset module state (model + form)
          setupDefaults();
          groupForm.$setUntouched();
          groupForm.$setPristine();

          // move view to the top - ready to create another entity
          // $state.reload();
          ScrollTo('anchor');
        } else {

          // navigate back to list view
          $state.go('debtorGroups.list', null, { reload : true });
        }
      })
      .catch(Notify.handleError);
  }
}
