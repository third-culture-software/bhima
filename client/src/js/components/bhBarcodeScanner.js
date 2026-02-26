angular.module('bhima.components')
  .component('bhBarcodeScanner', {
    templateUrl : 'modules/templates/bhBarcodeScanner.html',
    controller  : bhBarcodeScanner,
    bindings    : {
      onScanCallback : '&',
      shouldSearch : '<',
    },
  });

bhBarcodeScanner.$inject = [
  '$timeout', '$window', 'BarcodeService',
];

/**
 *
 * @param $timeout
 * @param $window
 * @param Barcode
 */
function bhBarcodeScanner($timeout, $window, Barcode) {
  const $ctrl = this;

  // steps in the search space
  const steps = {
    AWAIT_READ :  2,
    AWAIT_HTTP : 4,
    READ_SUCCESS : 8,
    READ_ERROR : 16,
    LOST_FOCUS : 32,
    NOT_FOUND : 64,
  };

  $ctrl.$onInit = () => {
    $ctrl.shouldSearch = angular.isDefined($ctrl.shouldSearch) ? $ctrl.shouldSearch : true;
    angular.extend($ctrl, { steps });
    $ctrl.currentStep = steps.AWAIT_READ;
    $ctrl.setFocusOnHiddenInput();
  };

  const setFocusOnHiddenInput = () => {
    // clear previous values
    delete $ctrl.barcode;

    // find and focus the input
    const input = $window.document.getElementById('hidden-barcode-input');
    input.focus();

    // set view state correctly
    $ctrl.isResetButtonVisible = false;
    $ctrl.currentStep = steps.AWAIT_READ;
  };

  // wrap setFocusOnHiddenInput() in $timeout to trigger $digest
  $ctrl.setFocusOnHiddenInput = () => {
    $timeout(setFocusOnHiddenInput);
  };

  $ctrl.triggerBarcodeRead = () => {
    $ctrl.currentStep = steps.AWAIT_HTTP;

    if (!$ctrl.shouldSearch) {
      $ctrl.onScanCallback({ record : { uuid : $ctrl.barcode } });
      return;
    }

    Barcode.search($ctrl.barcode)
      .then(record => {
        $ctrl.currentStep = steps.READ_SUCCESS;
        $ctrl.record = record;
        $ctrl.onScanCallback({ record });
      })
      .catch(err => {
        const isNotFound = (err.status === 404);
        $ctrl.currentStep = isNotFound ? steps.NOT_FOUND : steps.READ_ERROR;
        $ctrl.isResetButtonVisible = true;
      });

  };

  $ctrl.showResetButton = () => {
    $ctrl.isResetButtonVisible = true;
    $ctrl.currentStep = steps.LOST_FOCUS;
  };
}
