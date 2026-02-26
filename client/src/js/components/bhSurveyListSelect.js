angular.module('bhima.components')
  .component('bhSurveyListSelect', {
    templateUrl : 'modules/templates/bhSurveyListSelect.tmpl.html',
    controller  : SurveyListController,
    transclude  : true,
    bindings    : {
      onSelectCallback : '&',
      survey           : '<?',
      disable          : '<?',
      required         : '<?',
      surveyLabel      : '@?',
      collectorId      : '<?',
      isList           : '<?',
    },
  });

SurveyListController.$inject = ['SurveyFormService'];

/**
 * Survey List
 * @param SurveyForm
 */
function SurveyListController(SurveyForm) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.listLabel = $ctrl.listLabel || 'FORM.LABELS.CHOICE_FILTER_FROM';
    $ctrl.collectorId = parseInt($ctrl.collectorId, 10);

    SurveyForm.read(null, { data_collector_management_id : $ctrl.collectorId, is_list : $ctrl.isList })
      .then(items => {
        $ctrl.items = items;
      });
  };

  $ctrl.onSelect = survey => $ctrl.onSelectCallback({ survey });
}
