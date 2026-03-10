/**
 * @file bhExchangeRate
 * @description
 * This component allows to display the exchange rate
 */
angular.module('bhima.components')
  .component('bhExchangeRate', {
    templateUrl : 'modules/templates/bhExchangeRate.tmpl.html',
    controller : bhExchangeRateController,
    controllerAs : '$ctrl',
  });

bhExchangeRateController.$inject = [
  'CurrencyService', 'ExchangeRateService', 'SessionService',
  'NotifyService', 'moment',
];

/**
 *
 * @param Currencies
 * @param Rates
 * @param Session
 * @param Notify
 */
function bhExchangeRateController(Currencies, Rates, Session, Notify) {
  const $ctrl = this;

  $ctrl.today = new Date();
  $ctrl.primaryExchange = {};
  $ctrl.enterprise = Session.enterprise;
  $ctrl.EXCHANGE_RATE_DISPLAY_SIZE = 6;

  // load exchange rates
  /**
   *
   */
  function loadExchangeRates() {
    Currencies.read(true)
      .then((currencies) => {
        $ctrl.currencies = currencies.filter((currency) => {
          return currency.id !== Session.enterprise.currency_id;
        });

        // load supported rates
        return Rates.read(true);
      })
      .then(() => {
        $ctrl.currencies.forEach((currency) => {
          const rawRate = Rates.getCurrentRate(currency.id);

          // if the rate is less than 1, the enterprise currency is weak
          // relative to this foreign currency — display as "1 Foreign = X Enterprise"
          if (rawRate < 1) {
            currency.rate = Rates.round(1 / rawRate, 2);
            currency.isWeakCurrency = true;
          } else {
            currency.rate = rawRate;
            currency.isWeakCurrency = false;
          }
        });

        // get the first element of $ctrl.currencies ($ctrl.currencies[0])
        [$ctrl.primaryExchange] = $ctrl.currencies;
      })
      .catch(Notify.handleError);
  }

  $ctrl.$onInit = function onInit() {
    loadExchangeRates();
  };
}
