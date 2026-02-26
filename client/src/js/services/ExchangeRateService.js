angular.module('bhima.services')
  .service('ExchangeRateService', ExchangeRateService);

ExchangeRateService.$inject = [
  '$http', 'util', '$uibModal', 'CurrencyService', 'SessionService', 'NotifyService',
];

/**
 * Define a new error type
 */
class MissingCurrencyError extends Error {
  constructor(message, missing) {
    super(message);
    this.missing = missing;
  }
}

/**
 * Exchange Rate Service
 *
 * This goal of this service is to eventually replace the old `exchange` service,
 * which has a confusing API and is difficult to test, highly coupled to appstate,
 * and suffers from poorly written code.
 *
 * IMPORTANT:
 * The application no longer assumes that you need to have an exchange rate set
 * daily.  Instead, the previous valid rate will be used.  At startup, we check
 * first that we have defined at least one rate for every currency supported by
 * the application and throw a MISSING_EXCHANGE_RATES error if we are missing a base
 * rate for any of the currencies.
 * @param $http
 * @param util
 * @param Modal
 * @param Currencies
 * @param Session
 * @param Notify
 * @todo - How should we best handle errors such as looking up old dates before an
 * exchange rate is defined?  What happens when we call
 * service.convertToEnterpriseCurrency(someId, null, 100)?
 * @todo - documentation improvements
 */
function ExchangeRateService($http, util, Modal, Currencies, Session, Notify) {
  const service = {};

  // The cMap object contains rates namespaced by their currency IDs for faster
  // lookups when doing conversions.
  let cMap = {};

  service.missingRates = null;

  service.read = read;
  service.create = create;
  service.update = update;
  service.delete = del;
  service.convertToEnterpriseCurrency = convertToEnterpriseCurrency;
  service.convertFromEnterpriseCurrency = convertFromEnterpriseCurrency;
  service.getCurrentRate = getCurrentRate;
  service.getExchangeRate = getExchangeRate;
  service.getCurrentExchange = getCurrentExchange;
  service.getMissingExchangeRates = getMissingExchangeRates;
  service.warnMissingExchangeRates = warnMissingExchangeRates;

  service.round = round;

  /**
   *
   * @param value
   * @param precision
   */
  function round(value, precision = 4) {
    const base = 10 ** precision;
    return Math.round(value * base) / base;
  }

  /* ------------------------------------------------------------------------ */

  /**
   *
   * @param options
   */
  function read(options = {}) {
    let rates;

    service.missingRates = null;

    // if we have local cached rates, return them immediately
    // if (cache) { return $q.resolve(cache); }

    // query the exchange_rate table on the backend
    return $http.get('/exchange', { params : options })
      .then(util.unwrapHttpResponse)
      .then((data) => {

        // if there is no data, the controllers should be alerted
        // by throwing an missing exchange rate error.
        if (data.length === 0) {
          throw new Error('EXCHANGE.MISSING_EXCHANGE_RATES');
        }

        // share rates on promise chain, converting dates to date objects
        rates = data.map((row) => {
          row.date = new Date(row.date);
          return row;
        });

        // make sure we have a rate per currency by looping through the
        // currencies and verifying that each currency (besides the
        // enterprise currency) has an exchange rate
        return Currencies.read();
      })
      .then((currencyArray) => {

        // filter out the enterprise currency
        const currencies = currencyArray
          .filter((currency) => currency.id !== Session.enterprise.currency_id);

        // check if we have a rate for every currency defined
        const complete = currencies.every((currency) => {
          return rates.some((rate) => {
            return rate.currency_id === currency.id;
          });
        });

        // you must have at least one rate for each currency defined
        // if that doesn't exist, throw an error
        if (!complete) {
          const knownIds = (new Set([...rates.map(rate => rate.currency_id)])).add(Session.enterprise.currency_id);
          const missing = currencyArray.filter(cur => !knownIds.has(cur.id));
          service.missingRates = missing;
          throw new MissingCurrencyError('EXCHANGE.MUST_DEFINE_RATES_FIRST', missing);
        }

        // store the exchange rates for the fast future lookup.
        cMap = buildCMap(rates);

        // return the rates if all checks passed
        return rates;
      });
  }

  /**
   *
   * @param data
   */
  function create(data) {
    return $http.post('/exchange', { rate : data })
      .then(util.unwrapHttpResponse)
      .then((rates) => {
        // force refresh on successful data loading by busting the cached data
        read().then(() => {
          return rates;
        });
      });
  }

  /**
   *
   * @param id
   * @param rate
   */
  function update(id, rate) {
    return $http.put(`/exchange/${id}`, rate)
      .then(util.unwrapHttpResponse)
      .then((newRate) => {
        // force refresh on successful update
        read().then(() => {
          return newRate;
        });
      });
  }

  /**
   *
   * @param id
   */
  function del(id) {
    return $http.delete(`/exchange/${id}`)
      .then(util.unwrapHttpResponse)
      .then((resp) => {
        // force refresh on successful delete
        read().then(() => {
          return resp;
        });
      });
  }

  /**
   *
   * @param a
   * @param b
   */
  function sortByDate(a, b) {
    if (a.date > b.date) {
      return 1;
    }

    if (a.date === b.date) {
      return 0;
    }

    return -1;
  }

  // build the cMap object from an array of rates
  /**
   *
   * @param rates
   */
  function buildCMap(rates) {

    // initially sort the rates by date for fast lookups later (we can just take the last rate)!
    rates.sort(sortByDate);

    // turn a flat array into an object of currencyId mapped to all relevant rates
    return rates.reduce((map, row) => {

      // make an array for the currencyId if it doesn't already exist
      if (!map[row.currency_id]) { map[row.currency_id] = []; }

      // add the rate to the list of currency ids
      map[row.currency_id].push({ date : row.date, rate : row.rate });

      return map;
    }, {});
  }

  // converts an {amount} of money from {currencyId} to the enterprise currency
  // using the exchange rate valid for the date {date}
  /**
   *
   * @param currencyId
   * @param date
   * @param amount
   */
  function convertToEnterpriseCurrency(currencyId, date, amount) {
    const rate = getExchangeRate(currencyId, date);
    return amount * (1 / rate);
  }

  // converts an {amount} of money to {currencyId} from the enterprise currency
  // using the exchange rate valid for the date {date}
  /**
   *
   * @param currencyId
   * @param date
   * @param amount
   */
  function convertFromEnterpriseCurrency(currencyId, date, amount) {
    const rate = getExchangeRate(currencyId, date);
    return amount * rate;
  }

  // get the current exchange rate for a currency
  /**
   *
   * @param currencyId
   */
  function getCurrentRate(currencyId) {
    return getExchangeRate(currencyId, new Date());
  }

  /**
   * @param {*} currencyId
   * returs the max(by date) exchange rate
   */
  function getCurrentExchange(currencyId) {
    const exchanges = cMap[currencyId];
    let max = exchanges[0] || {};
    for (let i = 1; i < exchanges.length; i++) {
      if (max.date < exchanges[i].date) {
        max = exchanges[i];
      }
    }
    return max;
  }

  // get the rate for a currency on a given date
  /**
   *
   * @param currencyId
   * @param date
   */
  function getExchangeRate(currencyId, date) {

    // parse date into a date object (if not already a date)
    const cdate = new Date(Date.parse(date));

    // if we passed in the enterprise currency, just return the amount.  Allows
    // you to apply this transformation to a list of mixed currencies.
    if (currencyId === Session.enterprise.currency_id) { return 1; }

    // Get the current rates
    if (cMap[currencyId]) {
      // look up the rates for currencyId via the cMap object
      const rates = cMap[currencyId].filter((row) => row.date <= cdate);

      // get the last rate for the given currency
      const { rate } = rates[rates.length - 1];

      return rate;
    }

    // Warn the user if the currency does not have an exchange rate
    Notify.danger('EXCHANGE.MUST_DEFINE_RATES_FIRST', 60000);
    return null;
  }

  /**
   *
   */
  function getMissingExchangeRates() {
    // Reload to get the latest rates
    return service.missingRates;
  }

  // Warn the user using a modal with a link to fix missing exchange rates
  /**
   *
   * @param missing
   */
  function warnMissingExchangeRates(missing) {
    return Modal.open({
      templateUrl : 'modules/exchange/warnExchange.modal.html',
      controller : 'WarnExchangeMissingRateModalController as ModalCtrl',
      resolve : { missing : () => missing },
      size : 'lg',
    });
  }

  return service;
}
