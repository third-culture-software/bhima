angular.module('bhima.components')
  .component('bhRubricSelect', {
    templateUrl : 'modules/templates/bhRubricSelect.tmpl.html',
    controller  : RubricSelectController,
    transclude  : true,
    bindings    : {
      rubrics : '<',
      onSelectCallback : '&',
      required         : '<?',
      label            : '@?',
    },
  });

RubricSelectController.$inject = [
  'RubricService', '$timeout', '$scope', 'NotifyService',
];

/**
 * Rubric Select Controller
 * @param Rubric
 * @param $timeout
 * @param $scope
 * @param Notify
 */
function RubricSelectController(Rubric, $timeout, $scope, Notify) {
  const $ctrl = this;

  // fired at the beginning of the rubric configuration select
  $ctrl.$onInit = function $onInit() {
    // translated label for the form input
    $ctrl.label = $ctrl.label || 'FORM.LABELS.RUBRICS';
    $ctrl.rubrics = $ctrl.rubrics || [];
    // default for form name
    $ctrl.name = $ctrl.name || 'RubricForm';

    if (!angular.isDefined($ctrl.required)) {
      $ctrl.required = true;
    }

    Rubric.read()
      .then(rubrics => {
        $ctrl.allRubrics = rubrics;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = () => {
    $ctrl.onSelectCallback({ rubrics : $ctrl.rubrics });
  };

  // fires the onChange bound to the component boundary
  $ctrl.handleChange = () => $ctrl.onSelectCallback({ rubrics : $ctrl.rubrics });
}
