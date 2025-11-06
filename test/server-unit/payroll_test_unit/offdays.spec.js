const { expect } = require('chai');
const sinon = require('sinon');

// Import the DB module to mock it
const db = require('../../../server/lib/db');

// Import the controller to test
const controller = require('../../../server/controllers/admin/offdays');

describe('test/server-unit/payroll-test-unit/offdays', () => {

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

  // ---------------------------------------------------------
  it('list() should return status 200 with the list of Offdays', async () => {
    const offdayData = [
      {
        id              : 1,
        label           : 'Hero Lumumba',
        date            : '2025-01-17',
        percent_pay     : 100,
      }, {
        id              : 2,
        label           : 'Independence Day',
        date            : '2025-06-30',
        percent_pay     : 100,
      }, {
        id              : 3,
        label           : 'Fish Festival',
        date            : '2025-04-01',
        percent_pay     : 80,
      },
    ];

    sinon.stub(db, 'exec').returns(Promise.resolve(offdayData));

    await controller.list(req, res, next);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(offdayData)).to.equal(true);
  });

  // ---------------------------------------------------------
  it('detail() should return a offday by ID', (done) => {
    const record = {
      id           : 3,
      label        : 'Fish Festival',
      date         : '2025-04-01',
      percent_pay  : 80,
    };

    sinon.stub(db, 'one').resolves(record);
    req.params.id = 1;

    controller.detail(req, res, next);

    setImmediate(() => {
      try {
        expect(db.one.calledOnce).to.equal(true);
        expect(res.status.calledWith(200)).to.equal(true);
        expect(res.json.calledWith(record)).to.equal(true);
        done();
      } catch (err) {
        done(err);
      }
    });
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

  it('create() should insert a new title and return 201', (done) => {
    const insertResult = { insertId : 10 };
    sinon.stub(db, 'exec').resolves(insertResult);

    req.body = {
      label        : 'United States Independence Day',
      date         : '2025-07-04',
      percent_pay  : 100,
    };

    controller.create(req, res, next);

    setImmediate(() => {
      try {
        expect(db.exec.calledOnce).to.equal(true);
        expect(res.status.calledWith(201)).to.equal(true);
        expect(res.json.calledWith({ id : 10 })).to.equal(true);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('create() should call next(e) if the database throws an error', (done) => {
    const fakeError = new Error('SQL Error');
    sinon.stub(db, 'exec').rejects(fakeError);
    req.body = { label : 'Easter Monday', percent_pay : 35 };

    controller.create(req, res, next);

    setImmediate(() => {
      try {
        expect(next.calledWith(fakeError)).to.equal(true);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('update() should modify and return the updated offday', (done) => {
    const updated = { id : 1, label : 'Lumumba Day Commemoration' };

    sinon.stub(db, 'exec').resolves();
    sinon.stub(db, 'one').resolves(updated);

    req.params.id = 1;
    req.body = { label : 'Lumumba Day Commemoration' };

    controller.update(req, res, next);

    setImmediate(() => {
      try {
        expect(db.exec.calledOnce).to.equal(true);
        expect(db.one.calledOnce).to.equal(true);
        expect(res.status.calledWith(200)).to.equal(true);
        expect(res.json.calledWith(updated)).to.equal(true);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('update() should call next(e) if a SQL error occurs', (done) => {
    const fakeError = new Error('SQL Error');
    sinon.stub(db, 'exec').rejects(fakeError);
    req.params.id = 10;

    controller.update(req, res, next);

    setImmediate(() => {
      try {
        expect(next.calledWith(fakeError)).to.equal(true);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  // ---------------------------------------------------------
  it('delete() should call db.delete() with the correct arguments', () => {
    const deleteStub = sinon.stub(db, 'delete');
    req.params.id = 7;

    controller.delete(req, res, next);

    expect(deleteStub.calledOnce).to.equal(true);
    expect(deleteStub.firstCall.args[0]).to.equal('offday');
    expect(deleteStub.firstCall.args[1]).to.equal('id');
    expect(deleteStub.firstCall.args[2]).to.equal(7);
  });

  it('delete() should call db.delete() even if the Offday id is a string', () => {
    const deleteStub = sinon.stub(db, 'delete');
    req.params.id = 'str';

    controller.delete(req, res, next);

    expect(deleteStub.calledOnce).to.equal(true);
    expect(deleteStub.firstCall.args[0]).to.equal('offday');
    expect(deleteStub.firstCall.args[1]).to.equal('id');
    expect(deleteStub.firstCall.args[2]).to.equal('str');
  });
});
