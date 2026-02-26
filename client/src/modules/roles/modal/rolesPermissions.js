angular.module('bhima.controllers')
  .controller('RolesPermissionsController', RolesPermissionsController);

RolesPermissionsController.$inject = [
  'data', '$uibModalInstance', 'RolesService', 'NotifyService', 'Tree', '$q',
];

/**
 * @param data
 * @param ModalInstance
 * @param Roles
 * @param Notify
 * @param Tree
 * @param $q
 * @function RolesPermissionController
 * @description
 * Powers the modal that assigns units to roles.
 */
function RolesPermissionsController(data, ModalInstance, Roles, Notify, Tree, $q) {
  const vm = this;

  vm.role = angular.copy(data);

  vm.close = ModalInstance.dismiss;
  vm.submit = submit;

  vm.onChangeTree = (ids) => {
    vm.ids = ids;
  };

  /**
   *
   */
  function startup() {
    $q.all([Tree.all(), Roles.unit(vm.role.uuid)])
      .then(([tree, assignedUnits]) => {
        vm.units = tree.toArray();
        vm.mask = assignedUnits.map(unit => unit.id);
      });
  }

  /**
   *
   */
  function submit() {
    // gather all ids
    const { ids } = vm;

    const params = {
      role_uuid : vm.role.uuid,
      unit_ids : ids,
    };

    return Roles.affectPages(params)
      .then(() => {
        Notify.success('FORM.LABELS.PERMISSION_ASSIGNED_SUCCESS');

        // modal action was a success `close` will return correctly
        ModalInstance.close();
      })
      .catch(Notify.handleError);
  }

  startup();
}
