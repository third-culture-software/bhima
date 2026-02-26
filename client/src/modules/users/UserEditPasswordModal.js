angular.module('bhima.controllers')
  .controller('UsersPasswordModalController', UsersPasswordModalController);

UsersPasswordModalController.$inject = ['$state', 'UserService', 'NotifyService', 'params'];

/**
 * User Password Modal Controller
 *
 * This controller is responsible for changing a user's password.  Provides a
 * simply modal interface to
 * @param $state
 * @param Users
 * @param Notify
 * @param params
 */
function UsersPasswordModalController($state, Users, Notify, params) {
  const vm = this;

  vm.validPassword = validPassword;
  vm.submit = submit;
  vm.cancel = cancel;

  // checks if a valid password exists
  /**
   *
   */
  function validPassword() {
    return Users.validatePassword(vm.user.password, vm.user.passwordVerify);
  }

  // submits the password form
  /**
   *
   * @param passwordForm
   */
  function submit(passwordForm) {
    if (passwordForm.$invalid) { return 0; }
    if (passwordForm.$pristine || !validPassword()) { return 0; }

    // try to update the user's password
    return Users.updatePassword(params.id, { password : vm.user.password })
      .then(() => {
        Notify.success('USERS.UPDATED');
        $state.go('users.edit', { id : vm.user.id, creating : false });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function cancel() {
    $state.go('users.edit', { id : vm.user.id, creating : false });
  }

  Users.read(params.id)
    .then((user) => {
      vm.user = user;
    })
    .catch(Notify.handleError);
}
