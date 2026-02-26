angular.module('bhima.components')
  .component('bhUserSelect', {
    templateUrl : 'modules/templates/bhUserSelect.tmpl.html',
    controller  : UserSelectController,
    transclude  : true,
    bindings    : {
      onSelectCallback : '&',
      userId           : '<?',
      disable          : '<?',
      required         : '<?',
      label            : '@?',
    },
  });

UserSelectController.$inject = ['UserService'];

/**
 * User selection component
 * @param Users
 */
function UserSelectController(Users) {
  const $ctrl = this;

  $ctrl.label = $ctrl.label || 'FORM.LABELS.USER';

  $ctrl.$onInit = function onInit() {
    Users.read()
      .then(users => {
        $ctrl.users = users;
      });
  };

  $ctrl.onSelect = user => $ctrl.onSelectCallback({ user });
}
