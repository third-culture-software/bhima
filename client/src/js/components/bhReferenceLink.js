angular.module('bhima.components')
  .component('bhReferenceLink', {
    bindings : {
      reference : '<',
      display : '@?',
    },
    templateUrl : 'modules/templates/bhReferenceLink.tmpl.html',
    controller : bhReferenceLink,
  });

bhReferenceLink.$inject = ['LanguageService'];

// @TODO(sfount) allow a user setting to determine if this link should link directly
//               to external documents or take the user to a financial document search
/**
 *
 * @param Languages
 */
function bhReferenceLink(Languages) {
  const $ctrl = this;

  $ctrl.languageKey = Languages.key;
  $ctrl.displayLabel = '-';

  $ctrl.$onInit = function onInit() {
    $ctrl.displayLabel = $ctrl.display || $ctrl.reference;
  };

  $ctrl.$onChanges = function onChanges(changes) {
    // if the reference has changed - update the display value to keep up to date with this value
    if (changes.reference) {
      // still respect the display value if it has been explicitly defined
      $ctrl.displayLabel = $ctrl.display || changes.reference.currentValue;
    }

    // ensure the display value is given highest priority
    if (changes.display) {
      $ctrl.displayLabel = changes.display.currentValue;
    }
  };
}
