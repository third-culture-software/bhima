angular.module('bhima.controllers')
  .controller('CashDashboardController', CashDashboardController);

CashDashboardController.$inject = [
  'CashService', 'CashboxService', 'CurrencyService', 'SessionService', 'PeriodService',
];

/**
 * @class CashDashboardController
 *
 * @description
 * This controller is responsible for the cash dashboard.
 */
function CashDashboardController(
  Cash, Cashboxes, Currencies, Session, Periods,
) {
  const vm = this;

  // this is the cache payment form
  vm.timestamp = new Date();
  vm.enterprise = Session.enterprise;

  vm.selectCashbox = selectCashbox;

  // fired on controller start or form refresh
  function startup() {

    console.log('Periods:', Periods);

    const ctx = document.getElementById('cash-dashboard');
    const chart = new Chart(ctx, {
      type : 'line',
      options : {
        animation : false,
        scales : { y : { beginAtZero : true } },
      },
    });

    Cashboxes.read()
      .then(cashboxes => {
        vm.cashboxes = cashboxes;
        console.log('cashboxes:', cashboxes);
      });

    Currencies.read()
      .then((currencies) => {
        vm.currencies = currencies;
        console.log('currencies:', currencies);
      });

    // temporary data to try and power this chart
    Cash.read(null, { limit : 250 })
      .then(payments => {
        console.log('Payments:', payments.slice(0, 2));
      });

  }

  function load() {
    // noop()
    console.log('load()');
  }

  function selectCashbox(cashbox) {
    vm.cashbox = cashbox;
    return load();
  }

  // start up the module
  startup();
}
