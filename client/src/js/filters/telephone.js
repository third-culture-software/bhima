angular.module('bhima.filters')
  .filter('telephone', TelephoneFilter);

/**
 * Telephone Filter
 *
 * The telephone filter formats telephone numbers into nicely formatted strings.
 * If the number is unrecognized, it will simply return it.  Otherwise, it works
 * as follows for the following formats:
 *   1. 0821234567    => (082) 123-4567
 *   2. 243123456789  => +243 (12) 345-6789
 *
 * Derived from: http://jsfiddle.net/jorgecas99/S7aSj/.
 */
function TelephoneFilter() {
  return function telephone(tel) {

    // if no input, gracefully return an empty string
    if (!tel) { return ''; }

    // strip off whitespace and remove the leading '+' sign, if it exists.
    const value = tel.toString().trim().replace(/^\+/, '');

    // ensure that the value is composed only of numbers 0-9
    if (value.match(/[^0-9]/)) {
      return tel;
    }

    let country; let city; let number;

    /**
       * Switch to figure out what format to display the user based on the
       * length of the input.
       *  - if length < 10  => we simply display the original value.
       *  - if length is 10 => we assume that the country code doesn't exist.
       *                       So, we default to a single digit: 1 (the code for
       *                       the US).  We display the following format:
       *                          1 (###) ###-####
       *
       *  - if length is 11 => we assume that the country code is a single digit
       *                       and included in the telephone number.  Return the
       *                       following format:
       *                         # (###) ###-####
       *
       *  - if length is 12 => we assume that the country code is three digits
       *                       and included in the telephone number.  Return the
       *                       following format:
       *
       */
    switch (value.length) {
    case 10: // +1PPP####### -> C (PPP) ###-####
      country = 1;
      city = value.slice(0, 3);
      number = value.slice(3);
      break;

    case 11: // +CPPP####### -> C (PPP) ###-####
      [country] = value;
      city = value.slice(1, 4);
      number = value.slice(4);
      break;

    case 12: // +CCCPP####### -> CCC (PP) ###-####
      country = value.slice(0, 3);
      city = value.slice(3, 5);
      number = value.slice(5);
      break;

    default:
      return tel;
    }

    // if the country is defined, prepend a plus sign
    if (country) {
      country = `+${country}`;
    }

    // format the final portion of the like number ###-####
    number = `${number.slice(0, 3)}-${number.slice(3)}`;

    // concatenate everything together and return
    return (`${country} (${city}) ${number}`).trim();
  };
}
