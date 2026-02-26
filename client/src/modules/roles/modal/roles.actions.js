angular.module('bhima.controllers')
  .controller('RoleActionsController', RoleActionsController);
RoleActionsController.$inject = [
  'data', '$uibModalInstance', 'SessionService',
  'RolesService', 'SessionService', 'NotifyService',
];

/**
 * @param data
 * @param $uibModalInstance
 * @param Session
 * @param RolesService
 * @param session
 * @param Notify
 * @function RoleActionsController
 * @decription
 * Determines which actions can be applied to the role.
 */
function RoleActionsController(data, $uibModalInstance, Session, RolesService, session, Notify) {
  const vm = this;

  vm.assignActionToRole = assignActionToRole;
  vm.onChangeSelection = onChangeSelection;

  vm.role = { ...data };

  vm.close = () => $uibModalInstance.close();

  // loa all roles
  /**
   *
   */
  function loadActions() {
    return RolesService.actions(data.uuid)
      .then(actions => {
        vm.actions = actions;

        vm.checkedIds = actions
          .filter(action => action.affected)
          .map(action => action.id);
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param ids
   */
  function onChangeSelection(ids) {
    vm.checkedIds = ids;
  }

  // assigned actions to a role
  /**
   *
   */
  function assignActionToRole() {
    const param = {
      role_uuid : data.uuid,
      action_ids : [...vm.checkedIds],
    };

    return RolesService.assignActions(param)
      .then(() => {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
        return Session.reload();
      })
      .then(() => vm.close())
      .catch(Notify.handleError);
  }

  loadActions();
}
