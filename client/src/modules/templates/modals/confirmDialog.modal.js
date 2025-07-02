angular.module('bhima.controllers')
  .controller('ConfirmDialogModalController', ConfirmDialogModalController);

// dependencies injection
ConfirmDialogModalController.$inject = ['$uibModalInstance', '$translate', 'data'];

/**
 * Confirm Dialog Controller
 * This controller is responsible for check a match text given to continue
 * with an action
 */
function ConfirmDialogModalController(Instance, $translate, Data) {
  const vm = this;

  // expose to the view
  vm.accept = accept;
  vm.dismiss = Instance.dismiss;
  vm.close = Instance.close;
  // confirm modal without input field flag
  vm.noText = Data.noText || false;
  // initial setup
  startup();

  /** startup */
  function startup() {
    // Global objects
    vm.pattern = Data.pattern;
    vm.patternName = Data.patternName;

    // make sure the modal isn't accidentally called with empty values
    if (!Data.pattern || !Data.patternName) {
      throw new Error(`
        ConfirmDialogModal requires both a pattern and an element name to be defined, but received: 
        data.pattern = ${Data.pattern} and data.patternName = ${Data.patternName}
      `);
    }

    // value according context of the pattern
    vm.patternValue = { value : $translate.instant(Data.patternName) };
  }

  // matching
  function isMatching(text, pattern) {
    return pattern && text === pattern;
  }

  /** validation message */
  function validate(form) {
    vm.hasErrorMessage = form.$submitted;
    vm.hasWarningMessage = form.$submitted && vm.noCorrespondancy;
  }

  /** accept the action */
  function accept(form) {
    validate(form);

    const result = vm.noText ? true : isMatching(vm.pattern, vm.text);

    if (!form.$invalid && result) {
      Instance.close(result);
    } else if (!form.$invalid && !result) {
      vm.noCorrespondancy = $translate.instant('FORM.DIALOGS.NO_CORRESPONDANCY')
        .concat(` "${vm.text}" `);
    } else {
      vm.noCorrespondancy = $translate.instant('FORM.ERRORS.REQUIRED');
    }
  }
}
