angular.module('bhima.controllers')
  .controller('ColumnsConfigModalController', ColumnsConfigModalController);

ColumnsConfigModalController.$inject = ['$uibModalInstance', 'Columns'];

/**
 * @param ModalInstance
 * @param Columns
 * @module ColumnConfigModal
 * @description
 * This controller powers a generic modal that is used from the GridColumnService
 * to toggle column visibilities.
 */
function ColumnsConfigModalController(ModalInstance, Columns) {
  const vm = this;

  // make sure we do not have any blank columns
  vm.columns = Columns.getColumns().filter(column => column.displayName !== '');

  // visibility map
  vm.map = Columns.getColumnVisibilityMap();

  // the middle of the list to print elements in two columns
  vm.middle = Math.round(Object.keys(vm.columns).length / 2);

  /**
   * @function submit
   * @description
   * Registers the columns on the grid and then closes the modal
   */
  function submit() {
    if (vm.hasTooFewColumns) { return 0; }

    Columns.setVisibleColumns(vm.map);
    return ModalInstance.close();
  }

  // reset the column visibility to their default configuration
  /**
   *
   */
  function resetDefaults() {
    vm.hasTooFewColumns = false;
    Columns.resetDefaultVisibility();
    vm.map = Columns.getColumnVisibilityMap();
  }

  // dismiss the modal, canceling column updates
  /**
   *
   */
  function cancel() {
    ModalInstance.dismiss();
  }

  /**
   *
   */
  function checkVisible() {
    vm.hasTooFewColumns = !Columns.hasEnoughColumns(vm.map);
  }

  vm.submit = submit;
  vm.cancel = cancel;
  vm.resetDefaults = resetDefaults;
  vm.checkVisible = checkVisible;
}
