angular.module('bhima.components')
  .component('bhGradeSelect', {
    templateUrl : 'modules/templates/bhGradeSelect.tmpl.html',
    controller  : GradeSelectController,
    transclude  : true,
    bindings    : {
      gradeUuid        : '<',
      onSelectCallback : '&',
      required : '@?',
      label : '@?',
    },
  });

GradeSelectController.$inject = [
  'GradeService', 'NotifyService',
];

/**
 * Grade Select Controller
 *
 */
function GradeSelectController(Grades, Notify) {
  const $ctrl = this;
  $ctrl.label = $ctrl.label || 'FORM.LABELS.GRADE';
  $ctrl.$onInit = function onInit() {
    $ctrl.required = $ctrl.required || false;
    Grades.read()
      .then((grades) => {
        $ctrl.grades = grades;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = ($item) => {
    $ctrl.onSelectCallback({ grade : $item });
  };
}
