angular.module('bhima.services')
  .service('CurrencyService', CurrencyService);

CurrencyService.$inject = [
  '$http', '$q', 'util',
];

/**
 * @module services/CurrencyService
 *
 * Currency Service
 *
 * @description
 * This service is responsible for reading currencies from the database.  It
 * maintains a local cache so that currencies are not fetched multiple times.
 *
 */
function CurrencyService($http, $q, util) {
  const service = this;
  const baseUrl = '/currencies';
  let cache;
  let map;

  /** read (and cache) currencies from the database */
  service.read = read;

  /** get the symbol for a currency by id */
  service.symbol = symbol;

  /** get the full currency object for a currency */
  service.detail = detail;

  /** get the name for a currency by id */
  service.name = namer;

  /** get a nicely formatted label for a currency by id */
  service.format = format;

  /* ------------------------------------------------------------------------ */

  /**
   * Reads currencies from the database.  The results of the first request are
   * cached in a local cache so that future requests do not have to make an
   * additional HTTP request.
   *
   * @method read
   * @param {Boolean} forceCacheRefresh Optionally ensure the request does not
   *
   * @returns {Promise} A list of currencies from the database.
   */
  function read(forceCacheRefresh) {

    // if we have currencies cached, return them directly
    if (cache && !forceCacheRefresh) { return $q.resolve(cache); }

    return $http.get(baseUrl)
      .then(util.unwrapHttpResponse)
      .then((currencies) => {

        // cache currencies to avoid future HTTP lookups.
        cache = currencies;
        map = buildMap(currencies);

        return cache;
      });
  }

  /**
   * Look up the specific details of a particular currency by its id.
   *
   * @method detail()
   * @param {number} the currency id to look up
   * @return {Promise} a promise resolving to the currency object
   */
  function detail(id) {

    // if we have a cached version, return it immediately
    if (map && map[id]) { return $q.resolve(map[id]); }

    // fetch the currency from the server
    return $http.get(baseUrl.concat(`/${id}`))
      .then(util.unwrapHttpResponse)
      .then((currency) => {

        // ensure that the map exists
        if (!map) { map = {}; }

        // cache the currency for later
        map[currency.id] = currency;

        // return the fetched currency
        return currency;
      });
  }

  function buildMap(currencies) {
    return currencies.reduce((agg, row) => {
      if (!agg[row.id]) { agg[row.id] = row; }
      return agg;
    }, {});
  }

  /**
   * Returns the symbol associated with a given currency.
   *
   * @method symbol
   * @param {Number} id - the currency id to look up
   * @returns {String} The symbol associated with the currency or an empty string
   */
  function symbol(id) {
    return map ? map[id].symbol : '';
  }

  /**
   * Returns the symbol associated with a given currency.
   *
   * @method symbol
   * @param {Number} id - the currency id to look up
   * @returns {String} The symbol associated with the currency or an empty string
   */
  function namer(id) {
    return map ? map[id].name : '';
  }

  /**
   * Returns a nicely formatted label associated with a given currency by id.
   *
   * @method format
   * @param {Number} id - the currency id to look up
   * @returns {String} A label associated with the currency or an empty string
   */
  function format(id) {
    return `${namer(id)} (${symbol(id)})`;
  }

  return service;
}
