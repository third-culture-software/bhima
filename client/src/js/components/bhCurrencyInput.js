angular.module('bhima.components')
  .component('bhCurrencyInput', {
    templateUrl : 'modules/templates/bhCurrencyInput.tmpl.html',
    controller : CurrencyInputController,
    bindings : {
      currencyId : '<',  
      onChange   : '&',  
      value      : '<?',  
      label      : '@?',
      disabled   : '<?',
      required   : '<?',
      min        : '<?',
      horizontal : '<?',
    },
  });

CurrencyInputController.$inject = ['CurrencyService'];

/**
 * Currency Input Component
 *
 * <input type="number"> wrapper with currency-aware validation
 * (symbol prefix, minimum monetary unit, decimal step).
 *
 * Usage:
 *   <bh-currency-input
 *     currency-id="ctrl.currencyId"
 *     value="ctrl.amount"
 *     on-change="ctrl.onAmountChange(value)">
 *   </bh-currency-input>
 * @param {CurrencyService} Currencies
 */
function CurrencyInputController(Currencies) {
  const $ctrl = this;

  // unique id so <label for="..."> works even with multiple instances on a page
  $ctrl.inputId = `bh-currency-input-${Math.random().toString(36).slice(2, 9)}`;

  $ctrl.$onInit = () => {
    $ctrl.label = $ctrl.label || 'FORM.LABELS.AMOUNT';
    $ctrl.required = angular.isDefined($ctrl.required) ? $ctrl.required : true;
    $ctrl.currency = {};

    $ctrl.inputValue = $ctrl.value;

    $ctrl.minimumValue = angular.isDefined($ctrl.min) ? $ctrl.min : 0;
  };

  $ctrl.$onChanges = (changes) => {
    if (changes.currencyId) {
      const id = changes.currencyId.currentValue;
      if (angular.isDefined(id) && id !== null) {
        loadCurrency(id);
      } else {
        $ctrl.currency = {};
      }
    }

    // keep the internal editable copy synced if the parent updates `value` externally
    if (changes.value && !changes.value.isFirstChange()) {
      $ctrl.inputValue = changes.value.currentValue;
    }
  };

  /**
   * @param id
   * @private
   */
  function loadCurrency(id) {
    $ctrl.loadingCurrency = true;

    Currencies.detail(id)
      .then(currency => {
        $ctrl.currency = currency;
        $ctrl.minimumValue = angular.isDefined($ctrl.min) ? $ctrl.min : $ctrl.currency.min_monentary_unit;
      })
      .catch(() => {
        $ctrl.currency = {};
      })
      .finally(() => {
        $ctrl.loadingCurrency = false;
      });
  }

  /** @private */
  $ctrl.handleChange = () => {
    $ctrl.onChange({ value : $ctrl.inputValue });
  };
}
