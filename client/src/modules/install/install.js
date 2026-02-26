angular.module('bhima.controllers')
  .controller('InstallApplicationController', InstallApplicationController);

// dependencies injection
InstallApplicationController.$inject = ['InstallService', '$state', 'NotifyService', 'UserService'];

// controller definition
/**
 *
 * @param InstallService
 * @param $state
 * @param Notify
 * @param Users
 */
function InstallApplicationController(InstallService, $state, Notify, Users) {
  const vm = this;

  vm.setup = { enterprise : {}, project : {}, user : {} };

  // expose methods to the view
  vm.submit = submit;

  /**
   *
   */
  function notifyInstallSucess() {
    Notify.success('INSTALL.SUCCESS_INSTALL');
    $state.go('login');
  }

  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) { return 0; }

    if (vm.hasValidPassword() === false) {
      vm.badPasswords = true;
      return Notify.warn('USERS.PASSWORD_MISMATCH');
    }
    // the project informations can be equal to enterprise one if they not provided by the user when installing
    vm.setup.project.name = vm.setup.project.name || vm.setup.enterprise.name;
    vm.setup.project.abbr = vm.setup.project.abbr || vm.setup.enterprise.abbr;

    return InstallService.proceedInstall(vm.setup)
      .then(notifyInstallSucess)
      .catch(Notify.handleError);
  }

  vm.onSetCurrency = (currency) => {
    vm.setup.enterprise.currency_id = currency.id;
  };

  // make sure that the passwords exist, conform to the password policy, and match each other
  vm.hasValidPassword = () => {
    return Users.validatePassword(vm.setup.user.password, vm.setup.user.repassword);
  };
}
