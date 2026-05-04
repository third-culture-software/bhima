const { describe, it, before }= require('node:test');
const assert = require('node:assert/strict');
const rewire = require('rewire');

describe('test/server-unit/cron/addDynamicDatesOptions', () => {
  let addDynamicDatesOptions;

  const DAILY = 1;
  const WEEKLY = 2;
  const MONTHLY = 3;
  const YEARLY = 4;

  before(() => {
    const cronEmailReport = rewire('../../../server/controllers/admin/cronEmailReport');
    addDynamicDatesOptions = cronEmailReport.__get__('addDynamicDatesOptions');
  });

  it('#addDynamicDatesOptions() does nothing if cronId is unrecognized', () => {
    const options = { id : 1, label : 'Some ole options' };
    const processed = addDynamicDatesOptions(123, options);
    assert.deepEqual(processed, options);
  });

  it('#addDynamicDatesOptions() sets the DAILY schedule to the current day', () => {
    const options = { id : 1, label : 'A schedule' };
    const processed = addDynamicDatesOptions(DAILY, options);
    assert.ok(processed);

    const today = new Date().toDateString();
    assert.equal(processed.dateFrom.toDate().toDateString(), today);
    assert.equal(processed.dateTo.toDate().toDateString(), today);
  });

  it('#addDynamicDatesOptions() sets the WEEKLY schedule to the current week', () => {
    const options = { id : 1, label : 'A schedule' };
    const { dateFrom, dateTo } = addDynamicDatesOptions(WEEKLY, options);

    assert.equal(dateFrom.toDate().getDay(), 0, 'dateFrom should be the first day of the week (Sunday)');
    assert.equal(dateTo.toDate().getDay(), 6, 'dateTo should be the last day of the week (Saturday)');
  });

  it('#addDynamicDatesOptions() sets the MONTHLY schedule to the current month', () => {
    const options = { id : 1, label : 'A schedule' };
    const { dateFrom, dateTo } = addDynamicDatesOptions(MONTHLY, options);
    const today = new Date();

    assert.equal(dateFrom.toDate().getMonth(), today.getMonth());
    assert.equal(dateTo.toDate().getMonth(), today.getMonth());
    assert.equal(dateFrom.toDate().getDate(), 1, 'dateFrom should be the first day of the month');
    assert.ok(dateTo.toDate().getDate() >= 28, 'dateTo should be the last day of the month (at least 28)');
  });

  it('#addDynamicDatesOptions() sets the YEARLY schedule to the current year', () => {
    const options = { id : 1, label : 'A schedule' };
    const { dateFrom, dateTo } = addDynamicDatesOptions(YEARLY, options);

    const today = new Date();
    assert.equal(dateFrom.toDate().getFullYear(), today.getFullYear(), 'dateFrom should be the current year');
    assert.equal(dateTo.toDate().getFullYear(), today.getFullYear(), 'dateTo should be the current year');

    assert.equal(dateFrom.toDate().getMonth(), 0, 'dateFrom should be January');
    assert.equal(dateTo.toDate().getMonth(), 11, 'dateTo should be December');

    assert.equal(dateFrom.toDate().getDate(), 1, 'dateFrom should be the first day of the year');
    assert.equal(dateTo.toDate().getDate(), 31, 'dateTo should be the last day of the year');
  });
});
