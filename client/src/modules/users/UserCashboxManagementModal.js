angular.module('bhima.controllers')
  .controller('UsersCashBoxManagementController', UsersCashBoxManagementController);

UsersCashBoxManagementController.$inject = [
  '$state', 'UserService', 'NotifyService', 'appcache', 'CashboxService', '$q', 'params',
];

/**
 *
 * @param $state
 * @param Users
 * @param Notify
 * @param AppCache
 * @param Cashboxes
 * @param $q
 * @param params
 */
function UsersCashBoxManagementController($state, Users, Notify, AppCache, Cashboxes, $q, params) {
  const vm = this;
  const cache = AppCache('UserCashboxPermissions');

  if (params.id) {
    cache.stateParams = params;
    vm.stateParams = cache.stateParams;
  } else {
    vm.stateParams = cache.stateParams;
  }

  // the user object that is either edited or created
  vm.user = {};

  // exposed methods
  vm.submit = submit;

  vm.onChangeSelection = (ids) => {
    vm.ids = ids;
  };

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param userForm
   */
  function submit(userForm) {
    if (userForm.$invalid || !vm.user.id) { return null; }
    return Users.cashBoxManagement(vm.user.id, vm.ids)
      .then(() => {
        Notify.success('USERS.UPDATED');
        $state.go('users.list');
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function startup() {
    vm.loading = true;
    const promises = $q.all([
      Cashboxes.read(),
      Users.cashboxes(vm.stateParams.id),
      Users.read(vm.stateParams.id),
    ]);

    return promises
      .then(([cashboxes, selected, user]) => {
        angular.extend(vm, { cashboxes, selected, user });
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  startup();
}
