angular.module('bhima.controllers')
  .controller('AccountReferenceTypeController', AccountReferenceTypeController);

AccountReferenceTypeController.$inject = [
  '$state', 'AccountReferenceTypeService', 'NotifyService', 'uiGridConstants', 'ModalService',
];

/**
 * Account Reference Type Controller
 * This module is responsible for handling the CRUD operation on Account Reference Type
 */

/**
 *
 * @param $state
 * @param AccountReferenceType
 * @param Notify
 * @param uiGridConstants
 * @param ModalService
 */
function AccountReferenceTypeController($state, AccountReferenceType, Notify, uiGridConstants,
  ModalService) {
  const vm = this;
  vm.gridApi = {};
  vm.filterEnabled = false;
  vm.toggleFilter = toggleFilter;

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider  : vm,
    enableColumnMenus : false,
    fastWatch         : true,
    flatEntityAccess  : true,
    enableSorting     : true,
    onRegisterApi     : onRegisterApiFn,
    columnDefs : [
      {
        field : 'label',
        displayName : 'FORM.LABELS.DESIGNATION',
        enableFiltering : 'true',
        headerCellFilter : 'translate',
      }, {
        field : 'action',
        displayName : '',
        width : 120,
        enableFiltering : 'false',
        cellTemplate : '/modules/account_reference_type/templates/action.cell.html',
      },
    ],
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

  // bind methods
  vm.edit = edit;
  vm.remove = remove;

  /**
   *
   * @param accountReferenceType
   */
  function edit(accountReferenceType) {
    $state.go('account_reference_type.edit', { id : accountReferenceType.id });
  }

  /**
   *
   * @param id
   */
  function remove(id) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then((bool) => {
        if (!bool) { return; }

        AccountReferenceType.delete(id)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            loadGrid();
          })
          .catch(Notify.handleError);
      });
  }

  /**
   *
   * @param error
   */
  function handleError(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  /**
   *
   */
  function loadGrid() {
    vm.hasError = false;
    vm.loading = true;

    AccountReferenceType.read()
      .then((accountReferenceType) => {
        vm.gridOptions.data = AccountReferenceType.translateLabel(accountReferenceType);
      })
      .catch(handleError)
      .finally(toggleLoadingIndicator);
  }

  /**
   *
   */
  function toggleLoadingIndicator() {
    vm.loading = false;
  }

  loadGrid();
}
