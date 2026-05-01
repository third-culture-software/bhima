const { describe, it, before, mock, after }= require('node:test');
const assert = require('node:assert/strict');
const rewire = require('rewire');

describe('test/server-unit/cron/timers', () => {

  let CURRENT_JOBS;
  let addJob;
  let removeJob;

  // this crontab fires once a minute
  const CRONTAB = '* * * * *';

  before(() => {
    const cronEmailReport = rewire('../../../server/controllers/admin/cronEmailReport');
    addJob = cronEmailReport.__get__('addJob');
    removeJob = cronEmailReport.__get__('removeJob');
    CURRENT_JOBS = cronEmailReport.__get__('CURRENT_JOBS');
  });

  after(() => { mock.reset(); });

  it('#addJob() creates a cron job', () => {
    const cb = mock.fn();
    const job = addJob(CRONTAB, cb, {});

    assert.equal(cb.mock.callCount(), 0);
    assert.ok(job.isActive);
  });

  it('#addJob() will start the created cron job', () => {
    const cb = mock.fn();
    const job = addJob(CRONTAB, cb, {});
    assert.equal(cb.mock.callCount(), 0);

    // tick ahead a minute and a second
    mock.timers.tick(61 * 1000);

    assert.equal(cb.mock.callCount(), 1);
    assert.ok(job.isActive);
    mock.reset();
  });

  it('#removeJob() removes a cron job by its identifier', () => {
    // mock a cron job
    const stop = mock.fn();
    const id = 3;
    const job = { id, job : { stop } };
    CURRENT_JOBS.set(id, job);

    assert.equal(stop.mock.callCount(), 0);
    assert.equal(CURRENT_JOBS.size, 1);

    removeJob(id);

    assert.equal(stop.mock.callCount(), 1);
    assert.equal(CURRENT_JOBS.size, 0);
  });

  it('#removeJob() stops a running cron job added by #addJob()', () => {
    const cb = mock.fn();
    const job = addJob(CRONTAB, cb, {});
    const id = 7;
    CURRENT_JOBS.set(id, { id, job });

    assert.equal(cb.mock.callCount(), 0);
    assert.equal(CURRENT_JOBS.size, 1);

    // tick ahead a minute and a second
    mock.timers.tick(61 * 1000);

    assert.equal(cb.mock.callCount(), 1, 'callback should have been called once before job was stopped');
    assert.ok(job.isActive, 'Job should be active before it is stopped');

    removeJob(id);

    // tick ahead a minute and a second
    mock.timers.tick(61 * 1000);

    assert.equal(cb.mock.callCount(), 1, 'callback should not have been called again after job was stopped');
    assert.ok(!job.isActive, 'Job should have been stopped');
    mock.reset();
  });
});
