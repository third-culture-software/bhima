const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const logic = require('../../../server/controllers/payroll/multiplePayroll/datelogic');

describe('test/server-unit/payroll/datelogic', () => {

  it('#isDateOnWeekend() returns true if date in array passed in', () => {
    const date = new Date(2019, 1, 2); 
    assert.equal(logic.isDateOnWeekend(date, [6]), true);
    assert.equal(logic.isDateOnWeekend(date, [1, 6, 0]), true);
    assert.equal(logic.isDateOnWeekend(date, []), false);
    assert.equal(logic.isDateOnWeekend(date, [1, 5, 3]), false);
  });

  it('#createDateRange() returns an range of dates', () => {
    const numDays = 6;
    const start = new Date(2019, 1, 1);
    const end = new Date(2019, 1, 1 + numDays);

    const range = logic.createDateRange(start, end);
    assert.ok(Array.isArray(range));
    assert.equal(range.length, numDays + 1);
    assert.ok(range[0] instanceof Date);
  });

  it('#createDateRange() the first array element is the start date', () => {
    const numDays = 2;
    const start = new Date(2019, 1, 1);
    const end = new Date(2019, 1, 1 + numDays);
    const range = logic.createDateRange(start, end);
    assert.equal(range[0].getTime(), start.getTime());
  });

  it('#createDateRange() the last array element is the end date', () => {
    const numDays = 2;
    const start = new Date(2019, 1, 1);
    const end = new Date(2019, 1, 1 + numDays);
    const range = logic.createDateRange(start, end);
    assert.equal(range[range.length - 1].getTime(), end.getTime());
  });
});
