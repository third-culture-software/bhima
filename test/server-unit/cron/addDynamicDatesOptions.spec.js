const { expect } = require('chai');
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
    expect(processed).to.deep.equal(options);
  });

  it('#addDynamicDatesOptions() sets the DAILY schedule to the current day', () => {
    const options = { id : 1, label : 'A schedule' };
    const processed = addDynamicDatesOptions(DAILY, options);
    expect(processed.dateFrom).to.be.a('object');
    expect(processed.dateTo).to.be.a('object');

    const today = new Date().toDateString();

    expect(processed.dateFrom.toDate().toDateString()).to.equal(today);
    expect(processed.dateTo.toDate().toDateString()).to.equal(today);
  });

  it('#addDynamicDatesOptions() sets the WEEKLY schedule to the current week', () => {
    const options = { id : 1, label : 'A schedule' };

    const { dateFrom, dateTo } = addDynamicDatesOptions(WEEKLY, options);
    expect(dateFrom).to.be.a('object');
    expect(dateTo).to.be.a('object');

    // const today = new Date();

    expect(dateFrom.toDate().getDay()).to.equal(0);
    expect(dateTo.toDate().getDay()).to.equal(6);
  });

  it('#addDynamicDatesOptions() sets the MONTHLY schedule to the current month', () => {
    const options = { id : 1, label : 'A schedule' };

    const { dateFrom, dateTo } = addDynamicDatesOptions(MONTHLY, options);
    expect(dateFrom).to.be.a('object');
    expect(dateTo).to.be.a('object');

    const today = new Date();
    expect(dateFrom.toDate().getMonth()).to.equal(today.getMonth());
    expect(dateTo.toDate().getMonth()).to.equal(today.getMonth());

    expect(dateFrom.toDate().getDate()).to.equal(1);
    expect(dateTo.toDate().getDate()).to.be.at.least(28);
  });

  it('#addDynamicDatesOptions() sets the YEARLY schedule to the current year', () => {
    const options = { id : 1, label : 'A schedule' };

    const { dateFrom, dateTo } = addDynamicDatesOptions(YEARLY, options);
    expect(dateFrom).to.be.a('object');
    expect(dateTo).to.be.a('object');

    const today = new Date();
    expect(dateFrom.toDate().getFullYear()).to.equal(today.getFullYear());
    expect(dateTo.toDate().getFullYear()).to.equal(today.getFullYear());

    expect(dateFrom.toDate().getMonth()).to.equal(0);
    expect(dateTo.toDate().getMonth()).to.equal(11);

    expect(dateFrom.toDate().getDate()).to.equal(1);
    expect(dateTo.toDate().getDate()).to.equal(31);

  });
});
