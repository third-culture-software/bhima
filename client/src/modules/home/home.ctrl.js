angular.module('bhima.controllers')
  .controller('HomeController', HomeController);

HomeController.$inject = [
  'CurrencyService', 'ExchangeRateService', 'SessionService',
  'NotifyService', 'FiscalService', 'DashboardService', 'moment',
];

/**
 * Home Controller (system dashboard)
 *
 * This controller powers the system dashboard shown by default when the user
 * signs in. This is currently not very informative since the system is missing
 * the infrastructure to power the dashboard completely.
 *
 * @todo - implement actual system activity, such as patient registrations.
 * @todo - implement fiscal year client-side services to get relevant fiscal year
 * services and information.
 */
function HomeController(Currencies, Rates, Session, Notify, Fiscal, DashboardService, Moment) {
  const vm = this;

  vm.today = new Date();

  vm.primaryExchange = [];
  vm.correctDisplay = []; // just for displaying exchange rate in a friendly format
  // this limits the number of places that the page displays for the exchange rate
  vm.EXCHANGE_RATE_DISPLAY_SIZE = 6;

  // bind the session information
  vm.project = Session.project;
  vm.user = Session.user;
  vm.enterprise = Session.enterprise;

  // load exchange rates
  Currencies.read(true)
    .then((currencies) => {
      vm.currencies = currencies
        .filter(currency => currency.id !== Session.enterprise.currency_id);
      // format the enterprise currency
      vm.enterprise.currencyLabel = Currencies.format(vm.enterprise.currency_id);
      // load supported rates
      return Rates.read(true);
    })
    .then(() => {
      vm.currencies.forEach((currency) => {
        const exchange = Rates.getCurrentExchange(currency.id);
        currency.rate = exchange.rate;
        currency.date = exchange.date;
        currency.formattedDate = new Moment(currency.date).format('LL');
        vm.correctDisplay.push({
          curerency_rate : currency.rate < 1 ? 1 : currency.rate,
          curerency_symbol : currency.symbol,
          curerency_date : currency.formattedDate,
          entreprice_currency : currency.rate < 1 ? (1 / currency.rate).toFixed(2) : 1,
          entreprice_currency_symbol : vm.enterprise.currencySymbol,
        });
      });
      // @TODO Method for selecting primary exchange
      vm.primaryExchange = vm.currencies;
    })
    .catch(err => {
      if (err.message === 'EXCHANGE.MUST_DEFINE_RATES_FIRST') {
        Rates.warnMissingExchangeRates(err.missing);
      } else {
        Notify.handleError(err);
      }
    });

  Fiscal.getFiscalYearByDate({ date : vm.today })
    .then(([year]) => {
      vm.year = year || {};
      vm.year.percentage *= 100;
    })
    .catch(Notify.handleError);
}
