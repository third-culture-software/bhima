angular.module('bhima.components')
  .component('bhAnalysisToolTypeSelect', {
    templateUrl : 'modules/templates/bhAnalysisToolTypeSelect.tmpl.html',
    controller  : AnalysisToolTypeSelectController,
    transclude  : true,
    bindings    : {
      typeId   : '<?',
      onSelectCallback  : '&',
      disable           : '<?',
    },
  });

AnalysisToolTypeSelectController.$inject = ['ConfigurationAnalysisToolsService', 'AccountReferenceTypeService'];

/**
 * Analysis Tool Type Select Controller
 * @param AnalysisTools
 * @param AccountReferenceType
 */
function AnalysisToolTypeSelectController(AnalysisTools, AccountReferenceType) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    AnalysisTools.readType()
      .then(types => {
        AccountReferenceType.translateLabel(types);

        $ctrl.types = types;
      });
  };

  $ctrl.onSelect = type => $ctrl.onSelectCallback({ type });
}
