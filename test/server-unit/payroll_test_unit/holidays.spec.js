const { expect } = require('chai');
const sinon = require('sinon');

// Import the DB module to mock it
const db = require('../../../server/lib/db');

// Import the controller to test
const controller = require('../../../server/controllers/admin/holidays');

describe('test/server-unit/payroll-test-unit/holidays', () => {

  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { params : {}, body : {} };
    res = {
      status : sinon.stub().returnsThis(),
      json : sinon.stub(),
    };
    next = sinon.spy();
  });

  afterEach(() => {
    sinon.restore(); // reset mocks after each test
  });

  it('list() should return a status 200 with the list of holidays', async () => {
    const HolidayData = [
      {
        id : 1,
        label : 'Maternity Leave',
        employee_uuid : 'C5E85BCFAF410F7CCF93E096B8E5463C',
        dateFrom : '2025-09-01',
        dateTo : '2025-10-01',
        percentage : 75,
      }, {
        id : 2,
        label : 'Annual Holidays',
        employee_uuid : 'B8E54C5E85BF93E09663CFAF410F7CCC',
        dateFrom : '2017-11-01',
        dateTo : '2017-11-05',
        percentage : 100,
      },
    ];

    sinon.stub(db, 'exec').resolves(HolidayData);

    await controller.list(req, res, next);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(HolidayData)).to.equal(true);
  });

  it('detail() must return a holiday by Id', async () => {
    const record = { id : 1, label : 'Maternity Leave' };
    sinon.stub(db, 'one').resolves(record);
    req.params.id = 1;

    await controller.detail(req, res, next);

    expect(db.one.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(record)).to.equal(true);
  });

  it('detail() should call next(e) if a DB error occurs', (done) => {
    const fakeError = new Error('DB error');
    sinon.stub(db, 'one').rejects(fakeError);
    req.params.id = 1;

    controller.detail(req, res, next);

    setImmediate(() => {
      try {
        expect(next.calledWith(fakeError)).to.equal(true);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('create() must insert a new holiday and return 201', async () => {
    // Simulated data
    const insertResult = { insertId : 101 };

    // Stubs
    sinon.stub(db, 'bid').callsFake((uuid) => uuid); // éviter la conversion binaire
    const execStub = sinon.stub(db, 'exec');

    // 1st call to db.exec => checkHoliday (returns empty)
    // 2nd call to db.exec => INSERT (returns insertId)
    execStub
      .onFirstCall().resolves([]) // CheckHoliday result
      .onSecondCall().resolves(insertResult); // insertion result

    req.body = {
      label : 'Circumstance Leave',
      employee_uuid : 'B8E5410F7CCFC5E85BCFAF93E096463C',
      dateFrom : '2020-05-01',
      dateTo : '2020-05-05',
      percentage : 85,
    };

    // Execution
    await controller.create(req, res, next);

    //
    expect(execStub.calledTwice).to.equal(true);
    expect(execStub.secondCall.args[0]).to.match(/INSERT INTO holiday/i);
    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.calledWith({ id : 101 })).to.equal(true);
    expect(next.called).to.equal(false);
  });

  it('create() must not insert a holiday if it overlaps with an existing one', async () => {
    sinon.stub(db, 'bid').callsFake((uuid) => uuid);
    const execStub = sinon.stub(db, 'exec');

    // Simulates an overlap detected by checkHoliday()
    execStub.onFirstCall().resolves([
      {
        id : 99,
        employee_uuid : 'B8E5410F7CCFC5E85BCFAF93E096463C',
        dateFrom : '2020-05-03',
        dateTo : '2020-05-06',
      },
    ]);

    req.body = {
      label : 'Circumstance Leave',
      employee_uuid : 'B8E5410F7CCFC5E85BCFAF93E096463C',
      dateFrom : '2020-05-01',
      dateTo : '2020-05-05',
      percentage : 85,
    };

    await controller.create(req, res, next);

    // Flow checks
    expect(execStub.calledOnce).to.equal(true);
    expect(res.status.called).to.equal(false);
    expect(res.json.called).to.equal(false);
    expect(next.calledOnce).to.equal(true);

    // Checks the error object passed to next()
    const err = next.firstCall.args[0];
    expect(err).to.be.an('object');
    expect(err.code).to.equal('ERRORS.HOLIDAY_NESTED');
  });

  it('update() must modify and return the updated holiday', async () => {
    // Simulated data
    const updated = { id : 10, label : 'Conge non payé' };
    // Stub for db.bid
    sinon.stub(db, 'bid').callsFake((uuid) => uuid);

    // Stub for db.exec
    const execStub = sinon.stub(db, 'exec').callsFake((sql) => {
      if (/SELECT id, BUID\(employee_uuid\)/i.test(sql)) {
        // Call from checkHoliday: no conflict
        return Promise.resolve([]);
      }

      if (/UPDATE holiday/i.test(sql)) {
        // Call for UPDATE
        return Promise.resolve();
      }

      // Default case: returns an empty Promise
      return Promise.resolve();
    });

    // Stub pour lookupHoliday (db.one)
    sinon.stub(db, 'one').resolves(updated);

    // Simulated query
    req.params.id = 10;
    req.body = { label : 'Unpaid leave', employee_uuid : 'B8E5410F7CCFC5E85BCFAF93E096463C' };

    // Execution
    await controller.update(req, res, next);

    // Assertions
    expect(execStub.callCount).to.equal(2);
    expect(execStub.firstCall.args[0]).to.match(/SELECT id, BUID\(employee_uuid\)/i);
    expect(execStub.secondCall.args[0]).to.match(/UPDATE holiday/i);
    expect(db.one.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(updated)).to.equal(true);
    expect(next.called).to.equal(false);
  });

  it('update() must call next(e) if the database returns an error', async () => {
    const fakeError = new Error('Erreur SQL');

    // Stub db.bid to avoid conversion error
    sinon.stub(db, 'bid').callsFake((uuid) => uuid);

    // Stub db.exec to dismiss the error
    sinon.stub(db, 'exec').rejects(fakeError);

    req.params.id = 10;
    req.body = { label : 'Unpaid leave' };

    await controller.update(req, res, next);

    expect(next.calledOnce).to.equal(true);
    expect(next.firstCall.args[0]).to.equal(fakeError);
  });

  it('delete() must call db.delete() with the correct arguments', async () => {
    // Stub of the db.delete method and resolved automatically
    const deleteStub = sinon.stub(db, 'delete').resolves();

    // Prepare query parameters
    req.params.id = 5;

    // Calling the controller's delete method
    await controller.delete(req, res, next);

    // Checks
    expect(deleteStub.calledOnce).to.equal(true);
    expect(deleteStub.firstCall.args[0]).to.equal('holiday');
    expect(deleteStub.firstCall.args[1]).to.equal('id');
    expect(deleteStub.firstCall.args[2]).to.equal(5);
  });
});
