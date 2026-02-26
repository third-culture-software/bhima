/**
 * @file bhExchange
 * @description
 * This component allows to display the exchange rate list and also
 * a button for changing the exchange rate
 */
angular.module('bhima.components')
  .component('bhExchange', {
    templateUrl : 'modules/templates/bhExchange.tmpl.html',
    controller : bhExchangeController,
    controllerAs : '$ctrl',
  });

bhExchangeController.$inject = [
  'SessionService', 'ExchangeRateService', 'NotifyService', 'CurrencyService', '$uibModal',
];

/**
 *
 * @param Session
 * @param Exchange
 * @param Notify
 * @param Currencies
 * @param $uibModal
 */
function bhExchangeController(Session, Exchange, Notify, Currencies, $uibModal) {
  const $ctrl = this;

  $ctrl.loading = true;
  $ctrl.enterpriseCurrencyId = Session.enterprise.currency_id;
  $ctrl.rates = [];

  $ctrl.$onInit = () => {
    loadRates();
  };

  // load the exchange rates
  /**
   *
   */
  function loadRates() {
    Exchange.read({ limit : 5 })
      .then((rates) => {
        $ctrl.rates = rates;
      })
      .catch(err => {
        if (err.message === 'EXCHANGE.MUST_DEFINE_RATES_FIRST') {
          Notify.danger('EXCHANGE.MUST_DEFINE_RATES_FIRST', 60000);
        } else {
          Notify.handleError(err);
        }
      })
      .finally(() => {
        $ctrl.loading = false;
      });
  }

  // formats the currency nicely
  $ctrl.formatCurrency = Currencies.format;

  // opens a modal to set a new exchange rate
  $ctrl.setNewExchangeRate = function setNewExchangeRate() {
    const instance = $uibModal.open({
      templateUrl : 'modules/exchange/exchange.modal.html',
      controller : 'ExchangeRateModalController as ModalCtrl',
    }).result;

    instance
      .then(loadRates);
  };
}
