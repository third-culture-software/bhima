angular.module('bhima.controllers')
  .controller('ExchangeRateModalController', ExchangeRateModalController);

ExchangeRateModalController.$inject = [
  '$uibModalInstance', 'ExchangeRateService', 'CurrencyService',
  'SessionService', 'NotifyService', '$translate',
];

/**
 * This modal is a generic exchange rate modal that allows a user to
 * set the exchange rate from virtually anywhere in the application.
 *
 */
function ExchangeRateModalController(ModalInstance, Exchange, Currencies, Session, Notify, $translate) {
  const vm = this;

  // bind defaults
  vm.timestamp = new Date();
  vm.date = new Date();
  vm.enterprise = Session.enterprise;
  vm.missingRates = Exchange.getMissingExchangeRates();
  if (vm.missingRates) {
    vm.missingRatesWarning = $translate.instant('EXCHANGE.DEFINE_EXCHANGE_RATE', vm.missingRates[0]);
  }

  vm.rate = {
    date : new Date(),
  };

  vm.onDateChange = (date) => {
    vm.rate.date = date;
  };

  vm.submit = submit;
  vm.format = Currencies.format;
  vm.symbol = Currencies.symbol;
  vm.cancel = function cancel() { ModalInstance.dismiss(); };

  vm.selectCurrency = () => {
    vm.currentExchangeRate = Exchange.getCurrentRate(vm.rate.currency.id);
  };

  // this turns on and off the currency select input
  vm.hasMultipleCurrencies = false;

  Currencies.read()
    .then((currencies) => {
      vm.currencies = currencies
        .filter(currency => currency.id !== Session.enterprise.currency_id);

      // use the first currency in the list
      [vm.rate.currency] = vm.currencies;

      // if there are more than a single other currency (besides the enterprise currency)
      // show the currency selection input
      if (vm.currencies.length > 1) {
        vm.hasMultipleCurrencies = true;
      }

      vm.currentExchangeRate = Exchange.getCurrentRate(vm.rate.currency.id);
    })
    .catch(Notify.handleError);

  function submit(form) {
    if (form.$invalid) { return 0; }

    // gather form data for submission
    const data = angular.copy(vm.rate);

    data.enterprise_id = Session.enterprise.id;

    // TODO clean this up with proper ui-select syntax when internet available
    const { currency } = vm.rate;
    data.currency_id = currency.id;

    return Exchange.create(data)
      .then(() => {
        Notify.success('FORM.INFO.EXCHANGE_RATE_UPDATE_SUCCESS');
        ModalInstance.close();
      });
  }
}
