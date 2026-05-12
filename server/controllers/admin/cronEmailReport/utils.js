const BhMoment = require('../../../lib/bhMoment');

/**
 * @function addDynamicDatesOptions
 * @param {number} cronId - the identifier of the cron task from the database.
 * @param {object} options - the options object saved with the report information
 * @returns {object} the newly configured objects objection with starting and ending dates
 */
function addDynamicDatesOptions(cronId, options) {
  // cron ids
  const DAILY = 1;
  const WEEKLY = 2;
  const MONTHLY = 3;
  const YEARLY = 4;

  const period = new BhMoment(new Date());

  switch (cronId) {
  case DAILY:
    options.dateFrom = period.day().dateFrom;
    options.dateTo = period.day().dateTo;
    break;

  case WEEKLY:
    options.dateFrom = period.week().dateFrom;
    options.dateTo = period.week().dateTo;
    break;

  case MONTHLY:
    options.dateFrom = period.month().dateFrom;
    options.dateTo = period.month().dateTo;
    break;

  case YEARLY:
    options.dateFrom = period.year().dateFrom;
    options.dateTo = period.year().dateTo;
    break;

  default:
    break;
  }

  return options;
}

module.exports = { addDynamicDatesOptions };
