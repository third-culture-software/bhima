angular.module('bhima.components')
  .component('bhUser', {
    templateUrl : 'modules/templates/bhUser.tmpl.html',
    controller : bhUser,
    bindings : {
      details : '<',
      id : '<',
      fetch : '@',
    },
  });

bhUser.$inject = ['UserService', '$translate'];

/**
 * @param Users
 * @param $translate
 * @component bhUser
 * @description
 * Displays a system users details.
 *
 * If a `details` object is provided, this will be used by the component, otherwise
 * a `id` can be provided in combination with `fetch`, the component will be
 * responsible for getting the latest data.
 * @example
 * <bh-user details="user"></bh-user>
 *
 * <bh-user id="5" fetch></bh-user>
 */
function bhUser(Users, $translate) {
  const $ctrl = this;
  $ctrl.userDeactivated = $translate.instant('CASHBOX.USERS.DEACTIVATED');

  /**
   *
   * @param userId
   */
  function _loadUser(userId) {
    Users.read(userId)
      .then((user) => {
        $ctrl.user = user;
      });
  }

  $ctrl.$onChanges = function onChanges(changes) {
    // ensure the component keeps up with the parent controllers user ID one-way binding
    if (changes.id && changes.id.currentValue) {
      const shouldFetch = angular.isDefined($ctrl.fetch);

      // if the component is set to fetch details update to the new user ID
      if (shouldFetch) {
        _loadUser(changes.id.currentValue);
      }
    }

    if (changes.details && changes.details.currentValue) {
      // directly assing the new user details to the view
      $ctrl.user = changes.details.currentValue;
    }
  };
}
