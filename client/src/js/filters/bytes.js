angular.module('bhima.filters')
  .filter('bytes', BytesFilter);

BytesFilter.$inject = ['$translate'];

/**
 * Bytes Filter
 * Format bytes size to human readable format
 * @param $translate
 */
function BytesFilter($translate) {
  return function bytesfilter(bytes, precision = 1) {
    if (Number.isNaN(parseFloat(bytes)) || !Number.isFinite(bytes)) { return '-'; }
    let units = ['SIZE_BYTES', 'SIZE_KB', 'SIZE_MB', 'SIZE_GB', 'SIZE_TB', 'SIZE_TB'];
    const number = Math.floor(Math.log(bytes) / Math.log(1024));

    units = units.map((unit) => $translate.instant(`FORM.LABELS.${unit}`));

    return `${(bytes / (1024 ** Math.floor(number))).toFixed(precision)} ${units[number]}`;
  };
}
