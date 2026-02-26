angular.module('bhima.controllers')
  .controller('OffdayManagementController', OffdayManagementController);

OffdayManagementController.$inject = [
  'OffdayService', 'ModalService', 'NotifyService', 'uiGridConstants', '$state',
];

/**
 * Offday Management Controller
 *
 * This controller is about the Offday management module in the admin zone
 * It's responsible for creating, editing and updating a Offday
 * @param Offdays
 * @param ModalService
 * @param Notify
 * @param uiGridConstants
 * @param $state
 */
function OffdayManagementController(Offdays, ModalService, Notify, uiGridConstants, $state) {
  const vm = this;

  // bind methods
  vm.deleteOffday = deleteOffday;
  vm.editOffday = editOffday;
  vm.toggleFilter = toggleFilter;

  // global variables
  vm.gridApi = {};
  vm.filterEnabled = false;

  const columns = [
    { field : 'label', displayName : 'FORM.LABELS.DESIGNATION', headerCellFilter : 'translate' },
    {
      field : 'date', displayName : 'FORM.LABELS.DATE', cellFilter : 'date', headerCellFilter : 'translate',
    },
    {
      field : 'percent_pay', displayName : 'FORM.LABELS.PERCENTAGE', headerCellFilter : 'translate', type : 'number',
    },
    {
      field : 'action',
      width : 80,
      displayName : '',
      cellTemplate : '/modules/offdays/templates/action.tmpl.html',
      enableSorting : false,
      enableFiltering : false,
    },
  ];

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider  : vm,
    enableColumnMenus : false,
    fastWatch         : true,
    flatEntityAccess  : true,
    enableSorting     : true,
    onRegisterApi     : onRegisterApiFn,
    columnDefs : columns,
  };

  /**
   *
   * @param gridApi
   */
  function onRegisterApiFn(gridApi) {
    vm.gridApi = gridApi;
  }

  /**
   *
   */
  function toggleFilter() {
    vm.filterEnabled = !vm.filterEnabled;
    vm.gridOptions.enableFiltering = vm.filterEnabled;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  /**
   *
   */
  function loadOffdays() {
    vm.loading = true;

    Offdays.read()
      .then((data) => {
        vm.gridOptions.data = data;
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  // switch to delete warning mode
  /**
   *
   * @param title
   */
  function deleteOffday(title) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then((bool) => {
        if (!bool) { return; }

        Offdays.delete(title.id)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            loadOffdays();
          })
          .catch(Notify.handleError);
      });
  }

  // update an existing Offday
  /**
   *
   * @param title
   */
  function editOffday(title) {
    $state.go('offdays.edit', { id : title.id });
  }

  loadOffdays();
}
