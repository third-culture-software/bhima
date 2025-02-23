angular.module('bhima.components')
  .component('bhCurrencyInput', {
    templateUrl : 'modules/templates/bhCurrencyInput.tmpl.html',
    controller : CurrencyInputController,
    bindings : {
      currencyId : '<', // one-way binding
      model : '=', // two way binding
      label : '@?',
      disabled : '<?',
      required : '<?',
      min   : '@?',
      horizontal : '@?',
    },
  });

CurrencyInputController.$inject = ['CurrencyService'];

/**
 * Currency Input Component
 *
 * This is a currency input form based on <input type="number">, with specific
 * validation based on the currency being validated.
 */
function CurrencyInputController(Currencies) {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    // translated label for the form input
    $ctrl.label = $ctrl.label || 'FORM.LABELS.AMOUNT';
    $ctrl.required = angular.isDefined($ctrl.required) ? $ctrl.required : true;
  };

  $ctrl.$onChanges = function onChanges(changes) {
    if (changes.currencyId) {
      loadCurrency(changes.currencyId.currentValue);
    }
  };

  /* @private loads a particular currency from the server */
  function loadCurrency(id) {
    if (!angular.isDefined(id)) { return; }

    // load currency from the currency service
    Currencies.detail(id)
      .then(currency => {
        $ctrl.currency = currency;
      });
  }
}
