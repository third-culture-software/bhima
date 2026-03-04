angular.module('bhima.controllers')
  .controller('RolesPermissionsController', RolesPermissionsController);

RolesPermissionsController.$inject = [
  'data', '$uibModalInstance', 'RolesService', 'NotifyService', 'Tree', '$q', 'SessionService'
];

/**
 * @param data
 * @param ModalInstance
 * @param Roles
 * @param Notify
 * @param Tree
 * @param $q
 * @param Session
 * @function RolesPermissionController
 * @description
 * Powers the modal that assigns units to roles, and determins which actions can 
 * be applied to the role.
 */
function RolesPermissionsController(data, ModalInstance, Roles, Notify, Tree, $q, Session) {
  const vm = this;

  vm.role = angular.copy(data);

  vm.close = ModalInstance.dismiss;
  vm.submit = submit;

  vm.onChangePermissions = (ids) => { vm.updatedPermissionIds = ids; };
  vm.onChangeSelection = (ids) => { vm.updatedActonIds = ids; };

  /**
   *
   */
  function startup() {
    return $q.all([
      loadUnits(),
      loadActions()
    ])
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function loadUnits() {
    return $q.all([Tree.all(), Roles.unit(vm.role.uuid)])
      .then(([tree, assignedUnits]) => {
        vm.units = tree.toArray();
        vm.assignedUnits = assignedUnits.map(unit => unit.id);
      });
  }

  /**
   *
   */
  function loadActions() {
    return Roles.actions(data.uuid)
      .then(actions => {
        vm.actions = actions;

        vm.assignedActions = actions
          .filter(action => action.affected)
          .map(action => action.id);
      })
  }


  /**
   *
   */
  function submit() {
    const assignRoleUnits = {
      role_uuid : vm.role.uuid,
      unit_ids : vm.updatedPermissionIds,
    }

    const assignRoleActions = {
      role_uuid : vm.role.uuid,
      action_ids : vm.updatedActonIds,
    }

    // TODO(@jniles) - can this be done simultaneously?
    return Roles.assignUnits(assignRoleUnits)
      .then(() => Roles.assignActions(assignRoleActions))
      .then(() => {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
        return Session.reload();
      })
      .then(() => {
        // modal action was a success `close` will return correctly
        return vm.close();
      })
  }

  startup();
}
