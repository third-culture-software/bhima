angular.module('bhima.controllers')
  .controller('IprTaxManagementController', IprTaxManagementController);

IprTaxManagementController.$inject = [
  'IprTaxService', 'ModalService', 'NotifyService', 'uiGridConstants',
];

/**
 * IprTax Management Controller
 *
 * This controller is about the IprTax management module in the admin zone
 * It's responsible for creating, editing and updating a IprTax
 * @param IprTaxes
 * @param ModalService
 * @param Notify
 * @param uiGridConstants
 */
function IprTaxManagementController(IprTaxes, ModalService, Notify, uiGridConstants) {
  const vm = this;

  // bind methods
  vm.deleteIprTax = deleteIprTax;
  vm.toggleFilter = toggleFilter;

  // global variables
  vm.gridApi = {};
  vm.filterEnabled = false;

  const gridColumn = [
    { field : 'label', displayName : 'FORM.LABELS.DESIGNATION', headerCellFilter : 'translate' },
    { field : 'description', displayName : 'FORM.LABELS.DESCRIPTION', headerCellFilter : 'translate' },
    { field : 'currency_name', displayName : 'FORM.LABELS.CURRENCY', headerCellFilter : 'translate' },
    {
      field : 'action',
      width : 80,
      displayName : '',
      cellTemplate : '/modules/ipr_tax/templates/action.tmpl.html',
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
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  /**
   *
   */
  function loadIprTaxes() {
    vm.loading = true;

    IprTaxes.read()
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
   * @param title
   */
  function deleteIprTax(title) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(bool => {
        if (!bool) { return; }

        IprTaxes.delete(title.id)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            loadIprTaxes();
          })
          .catch(Notify.handleError);
      });
  }

  loadIprTaxes();
}
