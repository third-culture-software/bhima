angular.module('bhima.components')
  .component('bhGenderSelect', {
    templateUrl : 'js/components/bhGenderSelect/bhGenderSelect.tmpl.html',
    controller  : GenderSelectController,
    bindings    : {
      value            : '<',
      onSelectCallback : '&',
      required         : '<?',
    },
  });

GenderSelectController.$inject = ['bhConstants', '$translate'];

/**
 *
 * @param bhConstants
 * @param $translate
 */
function GenderSelectController(bhConstants, $translate) {
  const $ctrl = this;

  $ctrl.$onInit = () => {

    // load the gender list
    $ctrl.genderList = bhConstants.gender.map(g => {
      g.hrLabel = $translate.instant(g.translation_key);
      return g;
    });

  };

  $ctrl.onSelect = $item => {
    $ctrl.onSelectCallback({ gender : $item });
  };
}
