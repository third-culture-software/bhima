angular.module('bhima.components')
  .component('bhCurrencySelect', {
    controller  : bhCurrencySelect,
    templateUrl : 'modules/templates/bhCurrencySelect.tmpl.html',
    transclude  : true,
    bindings    : {
      currencyId        : '<?',
      onChange          : '&',
      label             : '@?',
      disableIds        : '<?',
      cashboxId         : '<?',
      required          : '<?',
    },
  });

bhCurrencySelect.$inject = ['CurrencyService'];

/**
 * @param Currencies
 * @class bhCurrencySelect
 * @description
 * This is a radio button currency selection component for choosing currencies
 * in a form.  If a list of currencies are passed in, these are used instead of
 * the application's currencies.
 *
 * BINDINGS
 *  - [currency-id]
 *      The model value for the underlying `<input>`s.  This
 *      is two-way bound to the parent controller.
 *  - [on-change]
 *      a callback bound the `ng-change` event on the `<input>`s.
 *
 *  - [disable-ids]
 *      an array of currency ids to be disabled as required.
 *
 *  - [cashbox-id]
 *      the cashbox id of the bound cashbox
 * @example
 * <!-- simple usage -->
 * <bh-currency-select
 *   currency-id="ParentCtrl.model.currencyId"
 *   >
 * </bh-currency-select>
 *
 * <!--
 *   complex usage: filter the currencies and register an onChange event
 * -->
 * <bh-currency-select
 *   currency-id="ParentCtrl.model.currencyId"
 *   on-change="ParentCtrl.currencyChangeEvent()"
 *   disable-ids="ParentCtrl.disabledIds"
 * </bh-currency-select>
 * @requires services/CurrencyService
 */
function bhCurrencySelect(Currencies) {
  const $ctrl = this;
  const { isArray } = angular;

  $ctrl.$onInit = function onInit() {
    // load all the available currencies
    Currencies.read()
      .then(currencies => {
        // cache a label for faster view rendering
        currencies.forEach(currency => {
          currency.label = Currencies.format(currency.id);
        });

        $ctrl.currencies = currencies;
      });

    $ctrl.required = angular.isDefined($ctrl.required) ? $ctrl.required : true;
    $ctrl.valid = true;

    $ctrl.label = $ctrl.label || 'FORM.LABELS.CURRENCY';
  };

  $ctrl.valueChange = (currency) => {
    $ctrl.onChange({ currency });
  };

  $ctrl.$onChanges = function onChanges(changes) {
    if (changes.disableIds) {
      digestDisableIds(changes.disableIds.currentValue);
    }

    // FIXME - why is this needed?
    if (changes.onChange) {
      $ctrl.onChange = changes.onChange.currentValue;
    }
  };

  /**
   *
   * @param disabledIds
   */
  function digestDisableIds(disabledIds) {
    // make sure there is something to digest
    if (!isArray(disabledIds)) { return; }
    if (!isArray($ctrl.currencies)) { return; }

    // loop through the currencies, disabling the currencies with ids in the
    // disableIds array.
    $ctrl.currencies.forEach(currency => {
      const disabled = disabledIds.indexOf(currency.id) > -1;
      currency.disabled = disabled;
      currency.title = disabled ? 'FORM.INFO.DISABLED_CURRENCY' : '';
    });

    // make sure we haven't defaulted to a currency that is not allowed by this casbhox
    // if so, delete it
    if (disabledIds.indexOf($ctrl.currencyId) > -1) {
      delete $ctrl.currencyId;
    }

    // if the two array lengths are equal, it means every currency is disabled.
    // there is no possible $valid state.
    $ctrl.valid = ($ctrl.currencies.length !== disabledIds.length);
  }
}
