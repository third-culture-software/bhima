angular.module('bhima.controllers')
  .controller('EntityGroupModalController', EntityGroupModalController);

EntityGroupModalController.$inject = [
  '$state', 'EntityGroupService', 'NotifyService', 'params',
];

/**
 *
 * @param $state
 * @param EntityGroup
 * @param Notify
 * @param params
 */
function EntityGroupModalController($state, EntityGroup, Notify, params) {
  const vm = this;
  const entityGroupUuid = params.uuid || {};

  vm.group = {};
  vm.isCreateState = !!(params.isCreateState);

  // exposed methods
  vm.submit = submit;

  vm.onSelectEntities = entities => {
    vm.group.entities = entities;
  };

  vm.clear = (key) => {
    delete vm[key];
  };

  /**
   *
   */
  function startup() {
    if (vm.isCreateState) { return; }

    EntityGroup.read(entityGroupUuid)
      .then(group => {
        vm.group = group;
      })
      .catch(Notify.handleError);
  }

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param entityForm
   */
  function submit(entityForm) {
    if (entityForm.$invalid) {
      return 0;
    }

    if (entityForm.$pristine) {
      cancel();
      return 0;
    }

    const parameters = vm.group;
    const promise = (vm.isCreateState)
      ? EntityGroup.create(parameters)
      : EntityGroup.update(entityGroupUuid, parameters);

    return promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'ENTITY.CREATED' : 'ENTITY.UPDATED';
        Notify.success(translateKey);
        $state.go('entityGroup', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function cancel() {
    $state.go('entityGroup');
  }

  startup();
}
