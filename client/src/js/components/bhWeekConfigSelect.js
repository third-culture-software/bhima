angular.module('bhima.components')
  .component('bhWeekendConfigSelect', {
    templateUrl : 'modules/templates/bhWeekendConfigSelect.tmpl.html',
    controller  : WeekConfigSelectController,
    transclude  : true,
    bindings    : {
      configWeekId : '<',
      onSelectCallback : '&',
      label            : '@?',
      required         : '<?',
    },
  });

WeekConfigSelectController.$inject = [
  'ConfigurationWeekendService', 'NotifyService',
];

/**
 * Week Configuration Select Controller
 * @param WeekConfigs
 * @param Notify
 */
function WeekConfigSelectController(WeekConfigs, Notify) {
  const $ctrl = this;

  // fired at the beginning of the weekend configuration select
  $ctrl.$onInit = function $onInit() {
    // translated label for the form input
    $ctrl.label = $ctrl.label || 'FORM.LABELS.WEEKEND_CONFIGURATION';

    $ctrl.isLoading = true;

    if (!angular.isDefined($ctrl.required)) {
      $ctrl.required = true;
    }

    WeekConfigs.read()
      .then(weekendConfigs => {
        $ctrl.weekendConfigs = weekendConfigs;
      })
      .catch(Notify.handleError)
      .finally(() => {
        $ctrl.isLoading = false;
      });
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = weekendConfig => {
    $ctrl.onSelectCallback({ weekendConfig });
  };
}
