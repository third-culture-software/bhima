const { describe, it }= require('node:test');
const assert = require('node:assert/strict');

const BhMoment = require('../../server/lib/bhMoment');

const dateString = '2019-08-24';
const startTime = '00:00:00.000';
const endTime = '23:59:59.999';

const date = new BhMoment(dateString);



/**
 *
 * @param startDate
 * @param endDate
 * @param dateBhMoment
 */
function evaluate(startDate, endDate, dateBhMoment) {
  const expected = {
    dateFrom : new Date(`${startDate}T${startTime}`),
    dateTo : new Date(`${endDate}T${endTime}`),
  };

  const formated = {
    dateFrom : dateBhMoment.dateFrom.toDate(),
    dateTo : dateBhMoment.dateTo.toDate(),
  };

  assert.deepEqual(formated, expected, 'The dateFrom and dateTo should match the expected values');
}

describe('test/server-unit/bhMoment', () => {

  it('#day() should return the start and stop dates of the given date', () => {
    const startDate = '2019-08-24';
    const endDate = '2019-08-24';
    evaluate(startDate, endDate, date.day());
  });

  it('#week() should return the start and stop dates of the week for the given date', () => {
    const startDate = '2019-08-18';
    const endDate = '2019-08-24';
    evaluate(startDate, endDate, date.week());
  });

  it('#month() should return the start and stop dates of the month for the given date', () => {
    const startDate = '2019-08-01';
    const endDate = '2019-08-31';
    evaluate(startDate, endDate, date.month());
  });

  it('#year() should return the start and stop dates of the year for the given date', () => {
    const startDate = '2019-01-01';
    const endDate = '2019-12-31';
    evaluate(startDate, endDate, date.year());
  });
});
