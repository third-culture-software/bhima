angular.module('bhima.components')
  .component('bhFluxSelect', {
    templateUrl : 'modules/templates/bhFluxSelect.tmpl.html',
    controller  : FluxSelectController,
    bindings    : {
      onChange : '&',
      fluxIds : '<?',
      label : '@?',
      required : '<?',
    },
  });

FluxSelectController.$inject = [
  'FluxService', 'NotifyService',
];

/**
 * @function FluxSelectController
 *
 * @description
 * Provides a ui-select of the flux options from the database.
 */
function FluxSelectController(Flux, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    // label to display
    $ctrl.label = $ctrl.label || 'STOCK.FLUX';

    // initialize the model
    $ctrl.selectedFlux = [];

    // load all Flux
    Flux.read()
      .then(flux => {
        $ctrl.fluxes = Flux.addI18nLabelToItems(flux);

        if ($ctrl.fluxIds) {
          $ctrl.selectedFlux = $ctrl.fluxes.filter(f => $ctrl.fluxIds.includes(f.id));
        }

        // sort the array in alphabetical order
        $ctrl.fluxes.sort((a, b) => a.plainText.localeCompare(b.plainText));
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component
  $ctrl.handleChange = flux => $ctrl.onChange({ flux });
}
