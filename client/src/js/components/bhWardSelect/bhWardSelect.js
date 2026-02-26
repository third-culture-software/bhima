angular.module('bhima.components')
  .component('bhWardSelect', {
    templateUrl : 'js/components/bhWardSelect/bhWardSelect.html',
    controller  : WardSelectController,
    transclude  : true,
    bindings    : {
      uuid      : '<',
      onSelectCallback : '&',
      required         : '<?',
      label            : '@?',
    },
  });

WardSelectController.$inject = ['WardService', 'NotifyService'];

/**
 * Ward selection component
 * @param Ward
 * @param Notify
 */
function WardSelectController(Ward, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.label = $ctrl.label || 'WARD.TITLE';

    // load all depots
    Ward.read(null)
      .then(wards => {
        $ctrl.wards = wards;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = $item => {
    $ctrl.onSelectCallback({ ward : $item });
  };
}
