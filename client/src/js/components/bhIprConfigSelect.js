angular.module('bhima.components')
  .component('bhIprConfigSelect', {
    templateUrl : 'modules/templates/bhIprConfigSelect.tmpl.html',
    controller  : IprConfigSelectController,
    transclude  : true,
    bindings    : {
      configIprId : '<',
      onSelectCallback : '&',
      required         : '<?',
      label            : '@?',
    },
  });

IprConfigSelectController.$inject = [
  'IprTaxService', 'NotifyService',
];

/**
 * Ipr Configuration Select Controller
 * @param IprConfigs
 * @param Notify
 */
function IprConfigSelectController(IprConfigs, Notify) {
  const $ctrl = this;

  // fired at the beginning of the ipr configuration select
  $ctrl.$onInit = function $onInit() {
    // translated label for the form input
    $ctrl.label = $ctrl.label || 'IPRTAX.CONFIG';

    if (!angular.isDefined($ctrl.required)) {
      $ctrl.required = true;
    }

    $ctrl.isLoading = true;

    IprConfigs.read()
      .then(iprConfigs => {
        $ctrl.iprConfigs = iprConfigs;
      })
      .catch(Notify.handleError)
      .finally(() => {
        $ctrl.isLoading = false;
      });
  };

  $ctrl.onSelect = iprConfig => $ctrl.onSelectCallback({ iprConfig });
}
