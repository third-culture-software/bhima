angular.module('bhima.components')
  .component('bhCronSelect', {
    templateUrl : 'js/components/bhCronSelect/bhCronSelect.html',
    controller  : CronSelectController,
    transclude  : true,
    bindings    : {
      id               : '<',
      onSelectCallback : '&',
      required         : '<?',
      label            : '@?',
    },
  });

CronSelectController.$inject = ['CronService', 'NotifyService', '$translate'];

/**
 * Cron selection component
 * @param Crons
 * @param Notify
 * @param $translate
 */
function CronSelectController(Crons, Notify, $translate) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.label = $ctrl.label || 'CRON.FREQUENCY';

    // load all depots
    Crons.read(null)
      .then(data => {
        $ctrl.crons = data.map(item => {
          item.hrLabel = $translate.instant(item.label);
          return item;
        });

      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = $item => {
    $ctrl.onSelectCallback({ cron : $item });
  };
}
