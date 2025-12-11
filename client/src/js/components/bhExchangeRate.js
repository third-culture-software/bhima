/**
 * @overview bhExchangeRate
 *
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

function bhExchangeRateController(Currencies, Rates, Session, Notify) {
  const $ctrl = this;

  $ctrl.today = new Date();
  $ctrl.primaryExchange = {};
  $ctrl.enterprise = Session.enterprise;
  $ctrl.EXCHANGE_RATE_DISPLAY_SIZE = 6;

  /*
    $ctrl.isFirstCurencyLabel is used to check the exchange Rate
    is lower then 1  the program display something
    mutch better for reading
  */
  $ctrl.isFirstCurencyLabel = false;

  // load exchange rates
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
          currency.rate = Rates.getCurrentRate(currency.id);

          /*
            Let check if the currency rate is lower the 1
            so that we could format it in a readable way
          */
          if (currency.rate < 1) {
            currency.rate = (1 / currency.rate);
            $ctrl.isFirstCurencyLabel = true;
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
