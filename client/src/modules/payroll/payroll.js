angular.module('bhima.controllers')
  .controller('PayrollConfigurationController', PayrollConfigurationController);

PayrollConfigurationController.$inject = [
  'PayrollConfigurationService', 'ModalService', 'NotifyService', 'uiGridConstants', '$state',
];

/**
 * Payroll Configuration Controller
 *
 * This controller is about the Payroll Configuration module
 * It's responsible for creating, editing and updating a Payroll Configuration
 * @param PayrollConfigurations
 * @param ModalService
 * @param Notify
 * @param uiGridConstants
 * @param $state
 */
function PayrollConfigurationController(PayrollConfigurations, ModalService, Notify, uiGridConstants, $state) {
  const vm = this;

  // bind methods
  vm.deletePayrollConfiguration = deletePayrollConfiguration;
  vm.editPayrollConfiguration = editPayrollConfiguration;
  vm.toggleFilter = toggleFilter;

  // global variables
  vm.gridApi = {};
  vm.filterEnabled = false;

  const gridColumn = [
    { field : 'label', displayName : 'FORM.LABELS.DESIGNATION', headerCellFilter : 'translate' },
    {
      field : 'dateFrom', displayName : 'FORM.LABELS.DATE_FROM', cellFilter : 'date', headerCellFilter : 'translate',
    },
    {
      field : 'dateTo', displayName : 'FORM.LABELS.DATE_TO', cellFilter : 'date', headerCellFilter : 'translate',
    },
    {
      field : 'action',
      width : 80,
      displayName : '',
      cellTemplate : '/modules/payroll/templates/action.tmpl.html',
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
  function loadPayrollConfiguration() {
    vm.loading = true;

    PayrollConfigurations.read()
      .then(data => {
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
   * @param payroll
   */
  function deletePayrollConfiguration(payroll) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(bool => {
        if (!bool) { return; }

        PayrollConfigurations.delete(payroll.id)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            loadPayrollConfiguration();
          })
          .catch(Notify.handleError);
      });
  }

  // update an existing Payroll Configuration
  /**
   *
   * @param payroll
   */
  function editPayrollConfiguration(payroll) {
    $state.go('payroll.edit', { id : payroll.id });
  }

  loadPayrollConfiguration();
}
