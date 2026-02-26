/* eslint-disable no-useless-escape */

angular.module('bhima.filters')
  .filter('currency', CurrencyFilter);

CurrencyFilter.$inject = [
  'currencyFormat', 'SessionService', '$translate',
];

/**
 *
 * @param CurrencyFormat
 * @param Session
 * @param $translate
 */
function CurrencyFilter(CurrencyFormat, Session, $translate) {
  const requireCurrencyDefinition = false;

  /**
   * BHIMA fork of angular's native currency filter.
   * Allows currency to be defined for each filter individually.
   * Currency IDs are used to fetch configuration files asynchronously from the server.
   * Completely separates locale from currency format to facilitate reliable accounting.
   * Clearly fails given an unsupported currency ID or configuration.
   *
   * Invoke from HTML:   <number> | currency: id : <numDigits>
   *
   * Note: numDigits is optional
   *
   * Examples:
   *    23.1 | currency : Session.enterprise.currency_id  --> 23.10 FC
   *    23.1 | currency : Session.enterprise.currency_id:0  --> 23 FC
   * @param {number} amount - Value to be converted into currency
   * @param {number} currencyId - ID for currency
   * @param {number} numDecimals - number digits after the decimal (optional, defaults default for currency)
   * @returns {string} Valid supported currency or error string
   */
  function currencyFilter(amount, currencyId, numDecimals) {
    const amountUndefined = angular.isUndefined(amount) || angular === null;

    if (angular.isUndefined(currencyId)) {

      if (requireCurrencyDefinition) {
        return formatError('EXCHANGE.INVALID_CURRENCY_DEFINITION', amount);
      }

      currencyId = Session.enterprise.currency_id;
    }

    // Terminate early to reduce calculations for ill formed requests
    if (amountUndefined) {
      return null;
    }

    // Currency cache has not yet retrieved available currency index
    if (!CurrencyFormat.indexReady()) {
      return null;
    }

    const formatConfiguration = CurrencyFormat.request(currencyId);

    // No configuration found - definition is probably being fetched
    if (angular.isUndefined(formatConfiguration)) {
      return null;
    }

    // Currency ID did not match a currency ID or format configuration was not found
    if (!formatConfiguration.supported) {
      return formatError('EXCHANGE.CURRENCY_NOT_SUPPORTED', amount);
    }

    return formatNumber(amount,
      formatConfiguration.PATTERNS[1], formatConfiguration.GROUP_SEP,
      formatConfiguration.DECIMAL_SEP, numDecimals)
      .replace(/\u00A4/g, formatConfiguration.CURRENCY_SYM);
  }

  // utility methods
  /**
   *
   * @param message
   * @param amount
   */
  function formatError(message, amount) {
    return $translate.instant(message).concat(' ', amount || '?');
  }

  // Formatting method directly from angular native filter - does not support BHIMA coding guidelines
  const DECIMAL_SEP = '.';

  /**
   * Format the number
   * @param {number} number - value of the number to format
   * @param {object} pattern - pattern
   * @param {string} groupSep - thousands group separator
   * @param {string} decimalSep - decimal symbol
   * @param {number} numDecimals - number of digits after the decimal
   * @returns {string} formatted number
   */
  function formatNumber(number, pattern, groupSep, decimalSep, numDecimals) {

    if (angular.isObject(number)) {
      // Ignore objects
      return '';
    }

    const isNegative = number < 0;

    // Deal with the non-negative value
    number = Math.abs(number);

    const isInfinity = number === Infinity;

    if (!isInfinity && !Number.isFinite(number)) {
      // Ignore NaNs
      return '';
    }

    const numStr = `${number} `;
    let formattedText = '';

    const hasExponent = numStr.indexOf('e') !== -1;
    const fractionLen = (numStr.split(DECIMAL_SEP)[1] || '').length;
    const parts = [];

    let fractionSize = Math.min(Math.max(pattern.minFrac, fractionLen), pattern.maxFrac);

    if (isInfinity) {
      formattedText = '\u221e';
    }

    if (!isInfinity && hasExponent) {
      const match = numStr.match(/([\d\.]+)e(-?)(\d+)/);
      // Force numbers very small numbers to zero
      if (match && match[2] === '-' && match[3] > fractionSize + 1) {

        number = 0;
      } else {
        formattedText = numStr;
      }
    }

    if (!isInfinity && !hasExponent) {

      // Just to use the number of decimals defined in the parameters
      fractionSize = numDecimals || fractionSize;

      if (!angular.isUndefined(numDecimals) && (numDecimals < fractionSize)) {
        fractionSize = numDecimals;
      }

      // safely round numbers in JS without hitting imprecisions of floating-point arithmetics
      // inspired by:
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
      number = +(Math.round(+(number.toString() + 'e' + fractionSize)).toString() + 'e' + -fractionSize);

      let fraction = ('' + number).split(DECIMAL_SEP);
      const whole = fraction[0];
      fraction = fraction[1] || '';

      let i;
      let pos = 0;
      const lgroup = pattern.lgSize;
      const group = pattern.gSize;

      if (whole.length >= (lgroup + group)) {
        pos = whole.length - lgroup;
        for (i = 0; i < pos; i++) {
          if ((pos - i) % group === 0 && i !== 0) {
            formattedText += groupSep;
          }
          formattedText += whole.charAt(i);
        }
      }

      for (i = pos; i < whole.length; i++) {
        if ((whole.length - i) % lgroup === 0 && i !== 0) {
          formattedText += groupSep;
        }
        formattedText += whole.charAt(i);
      }

      // format fraction part.
      while (fraction.length < fractionSize) {
        fraction += '0';
      }

      if (fractionSize && fractionSize !== '0') {
        formattedText += decimalSep + fraction.substr(0, fractionSize);
      }
    } else if (fractionSize > 0 && number < 1) {
      formattedText = number.toFixed(fractionSize);
      number = parseFloat(formattedText);
    }

    parts.push(isNegative ? pattern.negPre : pattern.posPre,
      formattedText,
      isNegative ? pattern.negSuf : pattern.posSuf);
    return parts.join('');
  }

  currencyFilter.$stateful = true;

  return currencyFilter;
}
