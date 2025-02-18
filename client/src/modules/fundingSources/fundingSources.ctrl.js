angular.module('bhima.controllers')
  .controller('FundingSourcesController', FundingSourcesController);

FundingSourcesController.$inject = [
  'FundingSourceService', 'ModalService',
  'NotifyService', 'uiGridConstants',
];

function FundingSourcesController(FundingSources, Modal, Notify, uiGridConstants) {
  const vm = this;

  vm.canEditFundingSources = false;

  // vm.createUpdateFundingSourcesModal = FundingSources.createUpdateFundingSourcesModal;

  vm.createUpdateFundingSourcesModal = (params) => {
    FundingSources.createUpdateFundingSourcesModal(params)
      .result.then(() => loadFundingSources());
  };

  vm.remove = function remove(uuid) {
    const message = 'FORM.DIALOGS.CONFIRM_ACTION';
    Modal.confirm(message)
      .then(confirmResponse => {
        if (!confirmResponse) {
          return;
        }
        FundingSources.delete(uuid)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            loadFundingSources();
          })
          .catch(Notify.handleError);
      });
  };

  function loadFundingSources() {
    vm.loading = true;
    vm.errorState = false;
    FundingSources.read()
      .then(data => {
        vm.gridOptions.data = data;
      })
      .catch(err => {
        vm.errorState = true;
        Notify.handleError(err);
      })
      .finally(() => {
        vm.loading = false;
      });
  }

  const columns = [{
    field : 'label',
    displayName : 'FORM.LABELS.NAME',
    headerCellFilter : 'translate',
  }, {
    field : 'code',
    displayName : 'FORM.LABELS.CODE',
    headerCellFilter : 'translate',
  }, {
    field : 'actions',
    enableFiltering : false,
    width : 100,
    displayName : '',
    headerCellFilter : 'translate',
    cellTemplate : '/modules/fundingSources/templates/action.cell.html',
  }];

  vm.gridOptions = {
    appScopeProvider : vm,
    enableColumnMenus : false,
    columnDefs : columns,
    enableSorting : true,
    data : [],
    fastWatch : true,
    flatEntityAccess : true,
    onRegisterApi : (gridApi) => {
      vm.gridApi = gridApi;
    },
  };

  loadFundingSources();
  /**
   * @function toggleInlineFilter
   *
   * @description
   * Switches the inline filter on and off.
   */
  vm.toggleInlineFilter = function toggleInlineFilter() {
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  };
}
