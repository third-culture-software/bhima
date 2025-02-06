angular.module('bhima.controllers')
  .controller('HolidayManagementController', HolidayManagementController);

HolidayManagementController.$inject = [
  'HolidayService', 'ModalService', 'NotifyService', 'uiGridConstants', '$state',
];

/**
 * Holiday Management Controller
 *
 * This controller is about the Holiday management module in the admin zone
 * It's responsible for creating, editing and updating a Holiday
 */
function HolidayManagementController(Holidays, ModalService, Notify, uiGridConstants, $state) {
  const vm = this;

  // bind methods
  vm.deleteHoliday = deleteHoliday;
  vm.editHoliday = editHoliday;
  vm.toggleFilter = toggleFilter;

  // global variables
  vm.gridApi = {};
  vm.filterEnabled = false;

  const gridColumn = [
    {
      field : 'display_name',
      displayName : 'FORM.LABELS.EMPLOYEE_NAME',
      headerCellFilter : 'translate',
    },
    {
      field : 'label',
      displayName : 'FORM.LABELS.DESIGNATION',
      headerCellFilter : 'translate',
    },
    {
      field : 'dateFrom',
      displayName : 'FORM.LABELS.DATE_FROM',
      cellFilter : 'date:"mediumDate"',
      headerCellFilter : 'translate',
    },
    {
      field : 'dateTo',
      displayName : 'FORM.LABELS.DATE_TO',
      cellFilter : 'date:"mediumDate"',
      headerCellFilter : 'translate',
    },
    {
      field : 'percentage',
      displayName : 'FORM.LABELS.PERCENTAGE',
      headerCellFilter : 'translate',
      type : 'number',
    },
    {
      field : 'action',
      width : 80,
      displayName : '',
      cellTemplate : '/modules/holidays/templates/action.tmpl.html',
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
    columnDefs : gridColumn,
  };

  function onRegisterApiFn(gridApi) {
    vm.gridApi = gridApi;
  }

  function toggleFilter() {
    vm.filterEnabled = !vm.filterEnabled;
    vm.gridOptions.enableFiltering = vm.filterEnabled;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  function loadHolidays() {
    vm.loading = true;

    Holidays.read(null, { detailed : 1 })
      .then((data) => {
        vm.gridOptions.data = data;
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  // switch to delete warning mode
  function deleteHoliday(title) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then((bool) => {
        if (!bool) { return; }

        Holidays.delete(title.id)
          .then(() => {
            Notify.success('FORM.LABELS.DELETED');
            loadHolidays();
          })
          .catch(Notify.handleError);
      });
  }

  // update an existing Holiday
  function editHoliday(title) {
    $state.go('holidays.edit', { id : title.id });
  }

  loadHolidays();
}

