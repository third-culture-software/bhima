angular.module('bhima.controllers')
  .controller('DebtorGroupController', DebtorGroupController);

DebtorGroupController.$inject = [
  '$state', 'DebtorGroupService', 'ColorService',
];

/**
 * This controller is responsible for loading debtor groups and providing basic
 * sorting/ filtering utilities.
 *
 * @todo  Pass debtor groups into create/update states to reduce the number of
 *        HTTP requests made - these pages should also link back to this controller
 *        without calling refresh : true and just passing back the object that changed
 *
 * @module finance/debtors/groups
 */
function DebtorGroupController($state, DebtorGroups, Color) {
  const vm = this;
  // pagination configuration
  /** @todo this should all be moved to a component */
  vm.pageSize = 10;
  vm.currentPage = 1;
  vm.debtorGroups = [];

  vm.toggleFilter = toggleFilter;
  vm.setOrder = setOrder;

  vm.state = $state;
  vm.colors = Color.list;

  vm.sortOptions = [
    { attribute : 'name', key : 'TABLE.COLUMNS.SORTING.NAME_ASC', reverse : false },
    { attribute : 'name', key : 'TABLE.COLUMNS.SORTING.NAME_DESC', reverse : true },
    { attribute : 'created_at', key : 'TABLE.COLUMNS.SORTING.CREATED_DESC', reverse : true },
    { attribute : 'created_at', key : 'TABLE.COLUMNS.SORTING.CREATED_ASC', reverse : false },
    { attribute : 'total_debtors', key : 'TABLE.COLUMNS.SORTING.TOTAL_ASC', reverse : true },
  ];

  DebtorGroups.read(null, { detailed : 1 })
    .then((debtorGroups) => {
      vm.debtorGroups = debtorGroups;
    })
    .catch(handleException);

  function handleException(error) {

    // expose error to view
    vm.exception = error;
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

  // expose states
  vm.isUpdateState = isUpdateState;
  vm.isEditState = isEditState;
  vm.isCreateState = isCreateState;

  // is update state function
  function isUpdateState() {
    return ($state.current.name === 'debtorGroups.update' || $state.current.name === 'debtorGroups.create');
  }

  // is edit state function
  function isEditState() {
    return ($state.current.name === 'debtorGroups.update');
  }

  // is create state function
  function isCreateState() {
    return ($state.current.name === 'debtorGroups.create');
  }
}
