
const { describe, it }= require('node:test');
const assert = require('node:assert/strict');

const dates = require('../../server/lib/template/helpers/dates');

describe('test/server-unit/dates', () => {

  it('#date() should format a date is "DD/MM/YYYY" format.', () => {
    const date = new Date('2015-03-25 12:00:00');
    const expected = '25/03/2015';
    const formated = dates.date(date);
    assert.equal(formated, expected, 'The date should be formated as "DD/MM/YYYY".');
  });

  it('#date() should return an empty string ("") if the date is null.', () => {
    const dat = null;
    const expected = '';
    const formated = dates.date(dat);
    assert.equal(formated, expected, 'The date should be an empty string.');
  });

  it('#date() should allow you to specify a custom format.', () => {
    const dat = new Date('2015-03-25');
    const expected = '03/2015';
    const format = 'MM/YYYY';
    const formated = dates.date(dat, format);
    assert.equal(formated, expected, 'The date should be formated as "MM/YYYY".');
  });

  it('#timestamp() should return an empty string ("") if the date is null.', () => {
    const dat = null;
    const expected = '';
    const formated = dates.timestamp(dat);
    assert.equal(formated, expected, 'The date should be an empty string.');
  });

  it('#timestamp() should format a date as DD/MM/YYYY HH:mm:ss.', () => {
    const dat = new Date('2015-03-25 10:05:15');
    const expected = '25/03/2015 10:05:15';
    const formated = dates.timestamp(dat);
    assert.equal(formated, expected, 'The date should be formated as "DD/MM/YYYY HH:mm:ss".');
  });

  it('#age() should return 0 for the current date.', () => {
    const dat = new Date();
    const expected = 0;
    const formated = dates.age(dat);
    assert.equal(formated, expected, 'The age should be 0 for the current date.');
  });

  it('#age() should return 3 for the current date.', () => {
    const current = new Date();
    const dob = new Date((current.getFullYear() - 3), current.getMonth());
    const formated = dates.age(dob);
    const expected = 3;
    assert.equal(formated, expected, 'The age should be 3 for a date of birth 3 years ago.');
  });

  it('#month should return the full month name in English for a given month.', () => {
    const dat = new Date('2015-03-25 10:05:15');
    const formated = dates.month(dat);
    const expected = 'March';
    assert.equal(formated, expected, 'The month should be "March" for the date "2015-03-25".');
  });
});
