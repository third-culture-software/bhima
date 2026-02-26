angular.module('bhima.controllers')
  .controller('UsersRolesController', UsersRolesController);

UsersRolesController.$inject = [
  'data', '$uibModal', '$uibModalInstance', 'RolesService', 'SessionService',
  'NotifyService',
];

/**
 *
 * @param data
 * @param $uibModal
 * @param $uibModalInstance
 * @param RolesService
 * @param Session
 * @param Notify
 */
function UsersRolesController(data, $uibModal, $uibModalInstance, RolesService, Session, Notify) {
  const vm = this;
  vm.close = close;
  vm.user = angular.copy(data);
  vm.assignRolesToUser = assignRolesToUser;
  vm.onChangeRoleSelection = onChangeRoleSelection;

  // load all roles
  /**
   *
   */
  function loadRoles() {
    RolesService.userRoles(vm.user.id)
      .then(roles => {
        vm.roles = roles;
        vm.selected = roles
          .filter(role => role.affected === 1)
          .map(role => role.uuid);
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param uuids
   */
  function onChangeRoleSelection(uuids) {
    vm.selected = uuids;
  }

  // assigned role to he user
  /**
   *
   */
  function assignRolesToUser() {
    const param = {
      user_id : vm.user.id,
      role_uuids : vm.selected || [],
    };

    return RolesService.assignToUser(param)
      .then(() => {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
        close();
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function close() { $uibModalInstance.close(); }

  loadRoles();
}
