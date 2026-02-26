angular.module('bhima.controllers')
  .controller('GradeIndiceModalController', GradeIndiceModalController);

GradeIndiceModalController.$inject = [
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
function GradeIndiceModalController($state, StaffingIndice, Notify, Instance, Modal) {
  const vm = this;
  vm.close = Instance.close;
  vm.submit = submit;
  vm.indice = {};
  vm.loading = false;

  const columns = [
    {
      field : 'grade_text',
      displayName : 'FORM.LABELS.LEVEL_OF_STUDY',
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
      cellTemplate : 'modules/payroll/staffing_indice/templates/gradeIndice.action.cell.html',
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

  // custom filter grade_uuid - assign the value to the searchQueries object
  vm.onSelectGrade = function onSelectGrade(grade) {
    vm.indice.grade_uuid = grade.uuid;
  };
  vm.onInputTextChange = (key, value) => {
    vm.indice[key] = value;
  };

  /**
   *
   */
  function loadGradeIndices() {
    vm.loading = true;
    StaffingIndice.gradeIndice.read().then(indices => {
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

    return StaffingIndice.gradeIndice.create(vm.indice)
      .then(() => {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
        loadGradeIndices();
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

        StaffingIndice.gradeIndice.delete(uuid)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            loadGradeIndices();
          })
          .catch(Notify.handleError);
      });
  };

  loadGradeIndices();
}
