
angular.module('bhima.components')
  .component('bhCurrencySelect', {
    controller  : bhCurrencySelect,
    templateUrl : 'modules/templates/bhCurrencySelect.tmpl.html',
    transclude  : true,
    bindings    : {
      currencyId : '<?',
      onChange   : '&',
      label      : '@?',
      disableIds : '<?',
      cashboxId  : '<?', 
      required   : '<?',
    },
  });

bhCurrencySelect.$inject = ['CurrencyService'];

/**
 * @param Currencies
 * @function bhCurrencySelect
 * @description
 * A radio button component for choosing a currency in a form. Currencies are
 * loaded from the CurrencyService.
 *
 * BINDINGS
 *  - [currency-id]  (one-way)
 *      The model value for the underlying `<input>`s.
 *  - [on-change]
 *      Callback fired when the selected currency changes.  Receives the
 *      selected `currency` as a local.
 *  - [disable-ids]
 *      An array of currency ids to disable.
 *  - [label]
 *      Translation key for the label (default: FORM.LABELS.CURRENCY).
 *  - [required]
 *      Whether a selection is required (default: true).
 *  - [cashbox-id]
 *      The id of the bound cashbox.
 * @example
 * <!-- simple usage -->
 * <bh-currency-select
 *   currency-id="ParentCtrl.model.currencyId">
 * </bh-currency-select>
 *
 * <!-- filter the currencies and register an onChange handler -->
 * <bh-currency-select
 *   currency-id="ParentCtrl.model.currencyId"
 *   on-change="ParentCtrl.currencyChangeEvent(currency)"
 *   disable-ids="ParentCtrl.disabledIds">
 * </bh-currency-select>
 * @requires services/CurrencyService
 */
function bhCurrencySelect(Currencies) {
  const $ctrl = this;

  const DEFAULT_LABEL = 'FORM.LABELS.CURRENCY';
  const DISABLED_TITLE = 'FORM.INFO.DISABLED_CURRENCY';

  // safe defaults so the template never sees undefined state
  $ctrl.currencies = [];
  $ctrl.valid = true;

  $ctrl.$onInit = function onInit() {
    $ctrl.required = angular.isDefined($ctrl.required) ? $ctrl.required : true;
    $ctrl.label = $ctrl.label || DEFAULT_LABEL;

    return Currencies.read()
      .then(currencies => {
        // copy each record so we don't mutate objects owned by the service,
        // and cache a formatted label for faster view rendering
        $ctrl.currencies = currencies.map(currency => Object.assign({}, currency, {
          label : Currencies.format(currency.id),
        }));

        // disableIds may have arrived before the currencies were loaded
        applyDisabledIds();
      });
  };

  $ctrl.$onChanges = function onChanges(changes) {
    if (changes.disableIds) {
      applyDisabledIds();
    }
  };

  $ctrl.valueChange = function valueChange(currency) {
    $ctrl.onChange({ currency });
  };

  /**
   * Marks currencies as disabled based on the `disableIds` binding and
   * recomputes the component's validity.
   */
  function applyDisabledIds() {
    const disabledIds = Array.isArray($ctrl.disableIds) ? $ctrl.disableIds : [];

    $ctrl.currencies.forEach(currency => {
      const disabled = disabledIds.includes(currency.id);
      currency.disabled = disabled;
      currency.title = disabled ? DISABLED_TITLE : '';
    });

    // do not leave a now-disallowed currency selected
    if (disabledIds.includes($ctrl.currencyId)) {
      $ctrl.currencyId = undefined;
    }

    // the component is only invalid if there are currencies and every one
    // of them is disabled (i.e. no valid selection is possible)
    $ctrl.valid = $ctrl.currencies.length === 0
      || $ctrl.currencies.some(currency => !currency.disabled);
  }
}
