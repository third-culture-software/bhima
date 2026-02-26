angular.module('bhima.controllers')
  .controller('ChoicesListManagementModalController', ChoicesListManagementModalController);

ChoicesListManagementModalController.$inject = [
  '$state', 'ChoicesListManagementService', 'NotifyService', 'appcache', 'params',
];

/**
 * choices list management modal controller
 * @param $state
 * @param ChoicesListManagement
 * @param Notify
 * @param AppCache
 * @param params
 */
function ChoicesListManagementModalController($state, ChoicesListManagement, Notify, AppCache, params) {
  const vm = this;
  const cache = AppCache('ChoicesListManagementModal');

  vm.choice = {};
  vm.stateParams = {};

  // exposed methods
  vm.submit = submit;
  vm.closeModal = closeModal;
  vm.clear = clear;
  vm.onSelectParent = onSelectParent;
  vm.onSelectGroup = onSelectGroup;

  if (params.isCreateState || params.id) {
    cache.stateParams = params;
    vm.stateParams = cache.stateParams;
    vm.choice.parent = params.parentId;
  } else {
    vm.stateParams = cache.stateParams;
  }
  vm.isCreateState = vm.stateParams.isCreateState;

  if (!vm.isCreateState) {
    ChoicesListManagement.read(vm.stateParams.id)
      .then(data => {
        vm.choice = data;
      })
      .catch(Notify.handleError);
  }

  // load choices list management
  ChoicesListManagement.read()
    .then(choicesList => {
      vm.choicesList = choicesList;
    })
    .catch(Notify.handleError);

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param choicesListManagementForm
   */
  function submit(choicesListManagementForm) {
    vm.hasNoChange = choicesListManagementForm.$submitted && choicesListManagementForm.$pristine && !vm.isCreateState;
    if (choicesListManagementForm.$invalid) { return null; }
    if (choicesListManagementForm.$pristine) { return null; }

    const promise = (vm.isCreateState)
      ? ChoicesListManagement.create(vm.choice)
      : ChoicesListManagement.update(vm.choice.id, vm.choice);

    return promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'FORM.INFO.CREATE_SUCCESS' : 'FORM.INFO.UPDATE_SUCCESS';
        Notify.success(translateKey);
        $state.go('choices_list_management', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param parent
   */
  function onSelectParent(parent) {
    vm.choice.parent = parent.id;
  }

  /**
   *
   * @param group
   */
  function onSelectGroup(group) {
    vm.choice.group_label = group.id;
  }

  /**
   *
   * @param value
   */
  function clear(value) {
    vm.choice[value] = 0;
  }

  /**
   *
   */
  function closeModal() {
    $state.go('choices_list_management');
  }
}
