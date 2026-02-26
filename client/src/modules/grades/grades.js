angular.module('bhima.controllers')
  .controller('GradeManagementController', GradeManagementController);

GradeManagementController.$inject = [
  'GradeService', 'ModalService', 'NotifyService', 'uiGridConstants', '$state',
  'SessionService',
];

/**
 * Grade Management Controller
 * @param Grades
 * @param Modals
 * @param Notify
 * @param uiGridConstants
 * @param $state
 * @param Session
 * @description
 * This controller is about the grade management module in the admin zone
 * It's responsible for creating, editing and updating a grade
 */
function GradeManagementController(Grades, Modals, Notify, uiGridConstants, $state, Session) {
  const vm = this;

  // bind methods
  vm.deleteGrade = deleteGrade;
  vm.toggleFilter = toggleFilter;

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider  : vm,
    enableColumnMenus : false,
    fastWatch         : true,
    flatEntityAccess  : true,
    enableSorting     : true,
    onRegisterApi     : gridApi => { vm.gridApi = gridApi; },
    columnDefs : [{
      field : 'code',
      displayName : 'FORM.LABELS.CODE',
      headerCellFilter : 'translate',
    }, {
      field : 'text',
      displayName : 'FORM.LABELS.DESIGNATION',
      headerCellFilter : 'translate',
    }, {
      field : 'basic_salary',
      displayName : 'FORM.LABELS.BASIC_SALARY',
      headerCellFilter : 'translate',
      cellFilter : 'currency:'.concat(Session.enterprise.currency_id),
      type : 'number',
    }, {
      field : 'action',
      width : 80,
      displayName : '',
      cellTemplate : '/modules/grades/templates/action.tmpl.html',
      enableSorting : false,
      enableFiltering : false,
    }],
  };

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
  function loadGrades() {
    vm.loading = true;

    Grades.read(null, { detailed : 1 })
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
   * @param grade
   */
  function deleteGrade(grade) {
    Modals.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(bool => {
        if (!bool) { return; }

        Grades.delete(grade.uuid)
          .then(() => {
            Notify.success('GRADE.DELETED');
            loadGrades();
          })
          .catch(Notify.handleError);
      });
  }

  loadGrades();
}
