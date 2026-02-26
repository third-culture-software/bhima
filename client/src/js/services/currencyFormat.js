/**
 * Provides asynchronous GET requests for currency configuration files, fetched
 * configurations are cached and served directly to subsequent requests.
 * @returns {object} Wrapper object exposing request configuration method
 */
angular.module('bhima.services')
  .factory('currencyFormat', currencyFormat);

currencyFormat.$inject = [
  'CurrencyService', '$http', 'Store',
];

/**
 *
 * @param Currencies
 * @param $http
 * @param Store
 */
function currencyFormat(Currencies, $http, Store) {
  const currencyConfigurationPath = '/i18n/currency/';
  let loadedSupportedCurrencies = false;
  const supportedCurrencies = new Store({ identifier : 'id' });
  const currentFormats = new Store({ identifier : 'format_key' });
  const fetchingKeys = [];
  const invalidCurrency = { supported : false };

  // Request all defined BHIMA currencies
  Currencies.read()
    .then(currencies => {
      supportedCurrencies.setData(currencies);
      loadedSupportedCurrencies = true;

      // automatically load all currency formats at startup
      currencies.forEach(currency => {
        searchFormatConfiguration(currency.id);
      });
    });

  // Requests individual currency configurations
  /**
   *
   * @param key
   */
  function fetchFormatConfiguration(key) {
    let formatObject = null;
    fetchingKeys[key] = true;

    $http.get(currencyConfigurationPath.concat(key.toLowerCase(), '.json'))
      .then(response => {

        // Add configuration to local cache
        formatObject = response.data;
        formatObject.supported = true;
        formatObject.format_key = key;
        addFormat(formatObject);
      })
      .catch(() => {

        // Deny future attempts to request this configuration
        formatObject = invalidCurrency;
        formatObject.format_key = key;
        addFormat(formatObject);
      });
  }

  /**
   *
   * @param formatObject
   */
  function addFormat(formatObject) {
    currentFormats.post(formatObject);
  }

  /**
   * Seach format configuration
   * @param {number} currencyId - ID of currency to be checked against BHIMA's database
   * @returns {object} Returns format configuration if it has been found and fetched,
   * objects reporting unsupported status if configuration or currency cannot be found
   */
  function searchFormatConfiguration(currencyId) {
    const supportedCurrency = supportedCurrencies.get(currencyId);

    if (angular.isUndefined(supportedCurrency)) {
      return invalidCurrency;
    }

    // currency has been identified - search for configuration
    const formatKey = supportedCurrency.format_key;
    const progress = fetchingKeys[formatKey];

    // initial for request for currency with this key - initialise configuration request
    if (!angular.isDefined(progress)) {
      fetchFormatConfiguration(formatKey);
    }

    return currentFormats.get(formatKey);
  }

  /**
   * Report status
   * @returns {boolean} Exposes status of initial currency index cache request
   */
  function reportStatus() {
    return loadedSupportedCurrencies;
  }

  return {
    request : searchFormatConfiguration,
    indexReady : reportStatus,
  };
}
