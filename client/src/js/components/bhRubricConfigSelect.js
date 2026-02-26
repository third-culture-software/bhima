angular.module('bhima.components')
  .component('bhRubricConfigSelect', {
    templateUrl : 'modules/templates/bhRubricConfigSelect.tmpl.html',
    controller  : RubricConfigSelectController,
    transclude  : true,
    bindings    : {
      configRubricId : '<',
      onSelectCallback : '&',
      required         : '<?',
      label            : '@?',
    },
  });

RubricConfigSelectController.$inject = [
  'ConfigurationService', '$timeout', 'NotifyService',
];

/**
 * Rubric Configuration Select Controller
 * @param RubricConfigs
 * @param $timeout
 * @param Notify
 */
function RubricConfigSelectController(RubricConfigs, $timeout, Notify) {
  const $ctrl = this;

  // fired at the beginning of the rubric configuration select
  $ctrl.$onInit = function $onInit() {
    $ctrl.isLoading = true;

    // translated label for the form input
    $ctrl.label = $ctrl.label || 'PAYROLL_RUBRIC.CONFIGURATION';

    // default for form name
    $ctrl.name = $ctrl.name || 'RubricConfigForm';

    if (!angular.isDefined($ctrl.required)) {
      $ctrl.required = true;
    }

    RubricConfigs.read()
      .then(rubricConfigs => {
        $ctrl.rubricConfigs = rubricConfigs;
      })
      .catch(Notify.handleError)
      .finally(() => {
        $ctrl.isLoading = false;
      });
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = rubricConfig => {
    $ctrl.onSelectCallback({ rubricConfig });
  };
}
