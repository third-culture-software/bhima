angular.module('bhima.controllers')
  .controller('GradeRubricsModalController', GradeRubricsModalController);

GradeRubricsModalController.$inject = [
  '$state', 'StaffingIndiceService',
  'NotifyService', '$uibModalInstance', 'ModalService', 'data', 'RubricService',
];

/**
 *
 * @param $state
 * @param StaffingIndice
 * @param Notify
 * @param Instance
 * @param Modal
 * @param data
 * @param Rubrics
 */
function GradeRubricsModalController($state, StaffingIndice, Notify, Instance, Modal, data, Rubrics) {
  const vm = this;
  vm.close = Instance.close;
  vm.submit = submit;
  vm.indice = {};
  vm.loading = false;

  vm.rubricId = data;

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
      cellTemplate : 'modules/payroll/staffing_indice/templates/gradeRubrics.action.cell.html',
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
  function loadGradeRubrics() {
    vm.loading = true;

    Rubrics.read(vm.rubricId)
      .then((rubric) => {
        vm.rubric = rubric;
        vm.indice.rubric_id = rubric.id;
      })
      .catch(Notify.handleError);

    StaffingIndice.rubricGradeRead({ rubric_id : vm.rubricId }).then(indices => {
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

    return StaffingIndice.rubricGradeCreate(vm.indice)
      .then(() => {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
        loadGradeRubrics();
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

        StaffingIndice.gradeRubricsDelete(uuid)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            loadGradeRubrics();
          })
          .catch(Notify.handleError);
      });
  };

  loadGradeRubrics();
}
