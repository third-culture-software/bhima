angular.module('bhima.components')
  .component('bhSurveyFormTypeSelect', {
    templateUrl : 'modules/templates/bhSurveyFormTypeSelect.tmpl.html',
    controller  : SurveyFormTypeSelectController,
    transclude  : true,
    bindings    : {
      onSelectCallback : '&',
      typeElement     : '<',
      required         : '<?',
      label            : '@?',
    },
  });

SurveyFormTypeSelectController.$inject = [
  'NotifyService', 'SurveyFormService', '$translate',
];

/**
 * Survey Form Type Select Controller
 * @param Notify
 * @param SurveyForm
 * @param $translate
 */
function SurveyFormTypeSelectController(Notify, SurveyForm, $translate) {
  const $ctrl = this;

  // fired at the beginning of the Survey type Configuration Select
  $ctrl.$onInit = () => {
    // translated label for the form input
    $ctrl.label = $ctrl.label || 'FORM.SELECT.TYPE';

    // load all Survey Form Type
    SurveyForm.listSurveyformtype()
      .then(surveyTypes => {
        surveyTypes.forEach((item) => {
          item.plainText = $translate.instant(item.label);
        });

        $ctrl.surveyTypes = surveyTypes;
      })
      .catch(Notify.handleError);
  };

  $ctrl.$onChanges = (changes) => {
    if (changes.typeElement && changes.typeElement.currentValue) {
      $ctrl.typeElement = parseInt(changes.typeElement.currentValue, 10);
    }
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = surveyType => {
    $ctrl.onSelectCallback({ surveyType });
  };
}
