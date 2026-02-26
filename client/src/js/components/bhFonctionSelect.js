angular.module('bhima.components')
  .component('bhFonctionSelect', {
    templateUrl : 'modules/templates/bhFonctionSelect.tmpl.html',
    controller  : FonctionSelectController,
    transclude  : true,
    bindings    : {
      fonctionId        : '<',
      onSelectCallback : '&',
      label : '@?',
    },
  });

FonctionSelectController.$inject = [
  'FunctionService', 'NotifyService',
];

/**
 * Fonction Select Controller
 * @param functions
 * @param Notify
 */
function FonctionSelectController(functions, Notify) {
  const $ctrl = this;
  $ctrl.$onInit = function onInit() {
    $ctrl.label = $ctrl.label || 'FORM.LABELS.JOB_FUNCTION';

    functions.read()
      .then(fct => {
        $ctrl.functions = fct;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = ($item) => {
    $ctrl.onSelectCallback({ fonction : $item });
  };
}
