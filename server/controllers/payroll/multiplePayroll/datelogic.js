/**
 * @function isDateOnWeekend
 *
 * @description
 * Returns true if the date passed in falls on the weekend configuration.
 */
function isDateOnWeekend(date, weekendDayIndex) {
  return weekendDayIndex.includes(new Date(date).getDay());
}

/**
 * @function createDateRange
 *
 * @description
 * Creates an array of dates, with each element being a date within
 * the start/end date period.  The start date is the first element
 * of the array.
 */
function createDateRange(start, end) {
  const dates = [];
  const currentDate = new Date(start);

  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

module.exports = {
  isDateOnWeekend,
  createDateRange,
};
