const moment = require('moment');

// format used in these helpers
const DATE_FMT = 'DD/MM/YYYY';
const TIMESTAMP_FMT = 'DD/MM/YYYY HH:mm:ss';

/**
 * @function date
 * @description
 * This method returns a string date for a particular value, providing the full
 * date in DD/MM/YYYY formatting.
 * @param {Date} value - the date value to be transformed
 * @param dateFormat
 * @returns {string} - the formatted string for insertion into templates
 */
function date(value, dateFormat) {
  const fmt = (!dateFormat || dateFormat.name === 'date') ? DATE_FMT : dateFormat;
  const input = moment(value);
  return input.isValid() ? input.format(fmt) : '';
}

/**
 * @function timestamp
 * @description
 * This method returns the timestamp of a particular value, showing the full date,
 * hours, minutes and seconds associated with the timestamp.
 * @param {Date} value - the date value to be transformed
 * @returns {string} - the formatted string for insertion into templates
 */
function timestamp(value) {
  const input = moment(value);
  return input.isValid() ? input.format(TIMESTAMP_FMT) : '';
}

/**
 * @function age
 * @description
 * This method returns the difference in years between the present time and a
 * provided date.
 * @param {Date} date - the date value to be transformed
 * @param dob
 * @returns {string} - the date difference in years between now and the provided
 *   date.
 */
function age(dob) {
  return moment().diff(dob, 'years');
}

/**
 * @function month
 * @description
 * This method provides the month name for a given date.
 * @param {Date} value - the date value to be transformed
 * @returns {string} - the month name in the chosen locale.
 */
function month(value) {
  return moment(value).format('MMMM');
}

exports.date = date;
exports.timestamp = timestamp;
exports.month = month;
exports.age = age;
