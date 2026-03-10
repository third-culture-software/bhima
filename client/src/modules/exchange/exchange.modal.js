angular.module('bhima.controllers')
  .controller('ExchangeRateModalController', ExchangeRateModalController);

ExchangeRateModalController.$inject = [
  '$uibModalInstance', 'ExchangeRateService', 'CurrencyService',
  'SessionService', 'NotifyService', '$translate',
];

/**
 * This modal is a generic exchange rate modal that allows a user to
 * set the exchange rate from virtually anywhere in the application.
 * @param ModalInstance
 * @param Exchange
 * @param Currencies
 * @param Session
 * @param Notify
 * @param $translate
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
    const rawRate = Exchange.getCurrentRate(vm.rate.currency.id);
    vm.isWeakCurrency = rawRate !== null && rawRate < 1;
    vm.currentExchangeRate = vm.isWeakCurrency ? Exchange.round(1 / rawRate, 2) : rawRate;
  };

  // this turns on and off the currency select input
  vm.hasMultipleCurrencies = false;

  // tracks whether the enterprise currency is weak relative to the selected foreign currency
  vm.isWeakCurrency = false;

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

      const rawRate = Exchange.getCurrentRate(vm.rate.currency.id);
      vm.isWeakCurrency = rawRate !== null && rawRate < 1;
      vm.currentExchangeRate = vm.isWeakCurrency ? Exchange.round(1 / rawRate, 2) : rawRate;
    })
    .catch(Notify.handleError);

  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) { return 0; }

    // gather form data for submission
    const data = angular.copy(vm.rate);

    data.enterprise_id = Session.enterprise.id;

    // TODO clean this up with proper ui-select syntax when internet available
    const { currency } = vm.rate;
    data.currency_id = currency.id;

    // if the enterprise currency is weak, the user entered the rate as
    // "1 [Foreign] = X [Enterprise]", so convert back to internal format
    if (vm.isWeakCurrency) {
      data.rate = 1 / data.rate;
    }

    return Exchange.create(data)
      .then(() => {
        Notify.success('FORM.INFO.EXCHANGE_RATE_UPDATE_SUCCESS');
        ModalInstance.close();
      });
  }
}
