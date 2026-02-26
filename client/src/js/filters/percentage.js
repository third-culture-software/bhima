angular.module('bhima.filters')
  .filter('percentage', PercentageFilter);

/**
 * Percentage Filter
 *
 * The percentage filter accepts a number and returns it as a percentage.
 */
function PercentageFilter() {
  return function percentage(number) {

    // escape if no input was passed in
    if (angular.isUndefined(number)) { return ''; }

    // cast value as number (or NaN)
    const value = Number(number);

     
    if (!isFinite(value) || Number.isNaN(value)) { return ''; }

    // return the value + a percentage sign
    return `${Math.round(value * 100) / 100}%`;
  };
}
