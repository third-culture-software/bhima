angular.module('bhima.components')
  .component('bhReceiptCurrency', {
    templateUrl : 'modules/templates/bhReceiptCurrency.tmpl.html',
    controller  : ReceiptCurrencyController,
    bindings    : {
      onUpdate : '&',
    },
  });

ReceiptCurrencyController.$inject = ['CurrencyService', 'SessionService', 'AppCache', 'Store'];

/**
 * Receipt Currency Component
 * @param Currencies
 * @param Session
 * @param AppCache
 * @param Store
 */
function ReceiptCurrencyController(Currencies, Session, AppCache, Store) {
  const ctrl = this;
  const cache = new AppCache('ReceiptCurrencyComponent');

  this.$onInit = function $onInit() {
    Currencies.read()
      .then((currencies) => {
        ctrl.currencies = new Store();
        ctrl.currencies.setData(currencies);
        loadDefaultCurrency();
      });
  };

  ctrl.update = function update(currency) {
    // update view with currency object (id and symbol)
    ctrl.selectedCurrency = currency;

    // update cache with id to select this currency object on next load
    cache.selectedCurrencyId = currency.id;

    // update bindings
    ctrl.onUpdate({ currencyId : currency.id });
  };

  /**
   *
   */
  function loadDefaultCurrency() {
    // if the cache exists - use that
    const cached = cache.selectedCurrencyId;
    if (cached) {
      ctrl.update(ctrl.currencies.get(cached));
      return;
    }

    // no cached value - use the enterprise currency
    ctrl.update(ctrl.currencies.get(Session.enterprise.currency_id));
  }
}
