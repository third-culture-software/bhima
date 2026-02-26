angular.module('bhima.controllers')
  .controller('UserRegistryModalController', UserRegistryModalController);

UserRegistryModalController.$inject = [
  '$uibModalInstance', 'filters', 'Store', 'util', 'PeriodService', 'UserService',
  'SearchModalUtilService', 'CashboxService', 'NotifyService', 'RolesService',
];

/**
 * @param ModalInstance
 * @param filters
 * @param Store
 * @param util
 * @param Periods
 * @param Users
 * @param SearchModal
 * @param CashBox
 * @param Notify
 * @param RolesService
 * @class UserRegistryModalController
 * @description
 * This controller is responsible for setting up the filters for the user
 * search functionality on the user registry page.  Filters that are already
 * applied to the grid can be passed in via the filters inject.
 */
function UserRegistryModalController(
  ModalInstance, filters, Store, util, Periods,
  Users, SearchModal, CashBox, Notify, RolesService) {
  const vm = this;
  const changes = new Store({ identifier : 'key' });

  // displayValues will be an id:displayValue pair
  const displayValues = {};

  const searchQueryOptions = [
    'display_name', 'depot_uuid', 'user_id', 'cashbox_id',
    'role_uuid', 'login_date_from', 'login_date_to',
  ];

  vm.filters = filters;

  vm.today = new Date();
  vm.defaultQueries = {};
  vm.searchQueries = {};

  // assign default limit filter
  if (filters.limit) {
    vm.defaultQueries.limit = filters.limit;
  }

  const lastDisplayValues = Users.filters.getDisplayValueMap();

  // assign already defined custom filters to searchQueries object
  vm.searchQueries = util.maskObjectFromKeys(filters, searchQueryOptions);

  // bind methods
  vm.submit = submit;
  vm.cancel = cancel;
  vm.clear = clear;

  // default filter limit - directly write to changes list
  vm.onSelectLimit = function onSelectLimit(val) {
    // input is type value, this will only be defined for a valid number
    if (angular.isDefined(val)) {
      changes.post({ key : 'limit', value : val });
    }
  };

  // default filter date_created - directly write to changes list
  vm.onSelectPeriod = function onSelectPeriod(period) {
    const periodFilters = Periods.processFilterChanges(period);
    const [periodeKey] = periodFilters.filter((item) => item.key === 'period');

    // change the key in date_created
    if (periodeKey) {
      periodeKey.key = 'date_created';
      changes.post(periodeKey);
      changes.post({ key : 'period', value : null });
    }
  };

  // custom filter user - assign the value to the params object
  vm.onSelectUser = function onSelectUser(user) {
    vm.searchQueries.user_id = user.id;
    displayValues.user_id = user.display_name;
  };

  // custom filter cashbox
  vm.onSelectCashbox = function onSelectCashbox(cash) {
    vm.searchQueries.cashbox_id = cash.id;
    displayValues.cashbox_id = cash.label;
  };

  // custom filter cashbox
  vm.onSelectRole = function onSelectRole(role) {
    vm.searchQueries.role_uuid = role.uuid;
    displayValues.role_uuid = role.label;
  };

  // custom filter depot_uuid - assign the value to the params object
  vm.onSelectDepot = function onSelectDepot(depot) {
    vm.searchQueries.depot_uuid = depot.uuid;
    displayValues.depot_uuid = depot.text;
  };

  // Save the login dates
  vm.onLoginDate = (dateFrom, dateTo) => {
    vm.searchQueries.login_date_from = dateFrom;
    displayValues.login_date_from = dateFrom;
    vm.searchQueries.login_date_to = dateTo;
    displayValues.login_date_to = dateTo;
  };
  // returns the parameters to the parent controller
  /**
   *
   */
  function submit() {
    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);
    return ModalInstance.close(loggedChanges);
  }

  // load cahsboxes
  /**
   *
   */
  function loadCashBoxes() {
    CashBox.read()
      .then((data) => {
        vm.cashboxes = data;
      }).catch(Notify.handleError);
  }
  // load all roles
  /**
   *
   */
  function loadRoles() {
    return RolesService.read()
      .then(role => {
        vm.roles = role;
      })
      .catch(Notify.handleError);
  }
  /**
   *
   * @param value
   */
  function clear(value) {
    delete vm.searchQueries[value];
  }

  // dismiss the modal
  /**
   *
   */
  function cancel() {
    ModalInstance.close();
  }

  loadCashBoxes();
  loadRoles();
}
