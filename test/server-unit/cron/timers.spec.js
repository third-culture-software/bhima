const { expect } = require('chai');
const chai = require('chai');

const sinon = require('sinon');
const rewire = require('@ima-worldhealth/rewire');

describe('test/server-unit/cron/timers', () => {

  let CURRENT_JOBS;
  let addJob;
  let removeJob;

  // this crontab fires once a minute
  const CRONTAB = '* * * * *';

  let clock;

  before(() => {
    const cronEmailReport = rewire('../../../server/controllers/admin/cronEmailReport');
    addJob = cronEmailReport.__get__('addJob');
    removeJob = cronEmailReport.__get__('removeJob');
    CURRENT_JOBS = cronEmailReport.__get__('CURRENT_JOBS');

    // use fake timers to emulate time passing
    clock = sinon.useFakeTimers();
  });

  after(() => {
    clock.restore();
  });

  it('#addJob() creates a cron job', () => {
    const cb = chai.spy(() => {});
    const job = addJob(CRONTAB, cb, {});

    expect(job).to.be.an('object');
    expect(job).to.have.any.keys('cronTime');
    expect(job.isActive).to.equal(true);
  });

  it('#addJob() will start the created cron job', () => {
    const cb = chai.spy(() => {});
    const job = addJob(CRONTAB, cb, {});

    // tick ahead a minute and a second
    clock.tick(61 * 1000);

    expect(cb).to.have.been.called.exactly(1);
    expect(job.isActive).to.equal(true);
  });

  it('#removeJob() removes a cron job by its identifier', () => {
    // mock a cron job
    const stop = chai.spy(() => {});
    const id = 3;
    const job = { id, job : { stop } };
    CURRENT_JOBS.set(id, job);

    expect(CURRENT_JOBS.size).to.equal(1);

    removeJob(id);

    expect(stop).to.have.been.called();
    expect(CURRENT_JOBS.size).to.equal(0);
  });

  it('#removeJob() stops a running cron job added by #addJob()', () => {
    const cb = chai.spy(() => {});
    const job = addJob(CRONTAB, cb, {});
    const id = 7;
    CURRENT_JOBS.set(id, { id, job });

    expect(CURRENT_JOBS.size).to.equal(1);

    // tick ahead a minute and a second
    clock.tick(61 * 1000);

    expect(cb).to.have.been.called.exactly(1);
    expect(job.isActive).to.equal(true);

    removeJob(id);

    // tick ahead a minute and a second
    clock.tick(61 * 1000);

    // the schedule should not have been called again
    expect(cb).to.have.been.called.exactly(1);
    expect(job.isActive).to.equal(false);
  });

});
