angular.module('bhima.controllers')
  .controller('FunctionIndiceModalController', FunctionIndiceModalController);

FunctionIndiceModalController.$inject = [
  '$state', 'StaffingIndiceService',
  'NotifyService', '$uibModalInstance', 'ModalService',
];

/**
 *
 * @param $state
 * @param StaffingIndice
 * @param Notify
 * @param Instance
 * @param Modal
 */
function FunctionIndiceModalController($state, StaffingIndice, Notify, Instance, Modal) {
  const vm = this;
  vm.close = Instance.close;
  vm.submit = submit;
  vm.indice = {};
  vm.loading = false;

  const columns = [
    {
      field : 'fonction_txt',
      displayName : 'FORM.LABELS.RESPONSABILITY',
      headerCellFilter : 'translate',
    },
    {
      field : 'value',
      displayName : 'FORM.LABELS.VALUE',
      headerCellFilter : 'translate',
      cellClass : 'text-right',
      type : 'number',
    },
    {
      field : 'actions',
      enableFiltering : false,
      width : 40,
      displayName : '',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/payroll/staffing_indice/templates/functionIndice.action.cell.html',
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

  vm.onSelectFonction = (fonction) => {
    vm.indice.fonction_id = fonction.id;
  };

  vm.onInputTextChange = (key, value) => {
    vm.indice[key] = value;
  };

  /**
   *
   */
  function loadFunctionIndices() {
    vm.loading = true;
    StaffingIndice.functionIndice.read().then(indices => {
      vm.gridOptions.data = indices;
    })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.HAS_ERRORS');
      return false;
    }

    return StaffingIndice.functionIndice.create(vm.indice)
      .then(() => {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
        loadFunctionIndices();
        reset(form);
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param form
   */
  function reset(form) {
    form.$setPristine();
    form.$setUntouched();
    vm.indice = {};
  }

  vm.remove = function remove(uuid) {
    const message = 'FORM.DIALOGS.CONFIRM_DELETE';
    Modal.confirm(message)
      .then(confirmResponse => {
        if (!confirmResponse) {
          return;
        }

        StaffingIndice.functionIndice.delete(uuid)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            loadFunctionIndices();
          })
          .catch(Notify.handleError);
      });
  };

  loadFunctionIndices();
}
