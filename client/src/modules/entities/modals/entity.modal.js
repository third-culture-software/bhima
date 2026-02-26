angular.module('bhima.controllers')
  .controller('EntityModalController', EntityModalController);

EntityModalController.$inject = [
  '$state', 'EntityService', 'NotifyService', 'params',
];

/**
 *
 * @param $state
 * @param Entities
 * @param Notify
 * @param params
 */
function EntityModalController($state, Entities, Notify, params) {
  const vm = this;

  vm.isCreateState = params.isCreateState;
  vm.entity = {};

  /**
   *
   */
  function startup() {
    if (!vm.isCreateState) {
      Entities.read(params.uuid)
        .then(entity => {
          vm.entity = entity;
        })
        .catch(Notify.handleError);
    }
  }

  // exposed methods
  vm.submit = submit;

  vm.onSelectEntityType = type => {
    vm.entity.entity_type_id = type.id;
  };

  vm.onSelectGender = gender => {
    vm.entity.gender = gender;
  };

  vm.clear = (key) => {
    delete vm[key];
  };

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

    const parameters = Entities.clean(vm.entity);

    const promise = (vm.isCreateState)
      ? Entities.create(parameters)
      : Entities.update(parameters.uuid, parameters);

    return promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'ENTITY.CREATED' : 'ENTITY.UPDATED';
        Notify.success(translateKey);
        $state.go('entities', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function cancel() {
    $state.go('entities');
  }

  startup();
}
