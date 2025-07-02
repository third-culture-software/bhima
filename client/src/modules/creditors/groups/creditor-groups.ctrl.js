angular.module('bhima.controllers')
  .controller('CreditorGroupController', CreditorGroupController);

CreditorGroupController.$inject = [
  '$state', 'CreditorGroupService', 'NotifyService', 'ModalService',
];

/**
 * This controller is responsible for loading creditor groups and providing basic
 * crud operations for creditor groups
 *
 * @module admin/creditor-groups
 */
function CreditorGroupController($state, CreditorGroup, Notify, Modal) {
  const vm = this;
  const { uuid } = $state.params;

  // global variables
  vm.bundle = {};
  vm.reload = { reload : true };
  vm.state = $state;
  vm.setOrder = setOrder;

  // page state
  vm.isDefaultState = ($state.current.name === 'creditorGroups');
  vm.isUpdateState = ($state.current.name === 'creditorGroups.update' && uuid);
  vm.isCreateState = ($state.current.name === 'creditorGroups.create');

  vm.toggleFilter = toggleFilter;
  vm.sortOptions = [
    { attribute : 'name', key : 'TABLE.COLUMNS.SORTING.NAME_ASC', reverse : false },
    { attribute : 'name', key : 'TABLE.COLUMNS.SORTING.NAME_DESC', reverse : true },
    { attribute : 'created_at', key : 'TABLE.COLUMNS.SORTING.CREATED_DESC', reverse : true },
    { attribute : 'created_at', key : 'TABLE.COLUMNS.SORTING.CREATED_ASC', reverse : false },
    { attribute : 'total_creditors', key : 'TABLE.COLUMNS.SORTING.TOTAL_ASC', reverse : true },
  ];

  // expose to public
  vm.submit = submit;
  vm.deleteGroup = deleteGroup;
  vm.onSelectAccount = onSelectAccount;

  // load the list state
  loadListState();

  // load the detail of the creditor group
  loadDetails();

  function onSelectAccount(account) {
    vm.bundle.account_id = account.id;
  }

  // load creditor groups
  CreditorGroup.read(null, { detailed : 1 })
    .then((list) => {
      vm.creditorGroupList = list;
    })
    .catch(Notify.handleError);

  /**
   * @function loadListState
   * set the app to creditorGroup.list
   */
  function loadListState() {
    if (!vm.isDefaultState) { return; }

    $state.go('creditorGroups.list', null, vm.reload);
  }

  /**
   * @function loadDetails
   * load details of a creditor group
   */
  function loadDetails() {
    if (!vm.isUpdateState) { return; }

    CreditorGroup.read($state.params.uuid)
      .then((detail) => {
        vm.bundle = detail;
        $state.params.label = detail.name;
      })
      .catch(Notify.handleError);
  }

  /**
   * @function deleteGroup
   * @description delete a creditor group
   */
  function deleteGroup(groupUuid) {
    Modal.confirm()
      .then((ans) => {
        if (!ans) { return false; }
        return CreditorGroup.delete(groupUuid);
      })
      .then((ans) => {
        if (!ans) { return; }

        Notify.success('FORM.INFO.DELETE_SUCCESS');
        $state.go('creditorGroups.list', null, vm.reload);
      })
      .catch(Notify.handleError);
  }

  /**
   * @function submit
   * submit data to the server
   */
  function submit(form) {
    if (form.$invalid) { return 0; }

    const promise = vm.isUpdateState
      ? CreditorGroup.update(uuid, vm.bundle)
      : CreditorGroup.create(vm.bundle);

    return promise
      .then(() => {
        Notify.success(vm.isUpdateState ? 'FORM.INFO.UPDATE_SUCCESS' : 'FORM.INFO.CREATE_SUCCESS');

        // navigate back to list view
        $state.go('creditorGroups.list', null, vm.reload);
      })
      .catch(Notify.handleError);
  }

  // Naive filter toggle - performance analysis should be done on this
  function toggleFilter() {
    if (vm.filterActive) {
      // clear the filter
      vm.filterActive = false;
      vm.filter = '';
    } else {
      vm.filterActive = true;
    }
  }

  function setOrder(attribute) {
    vm.sort = attribute;
  }
}
