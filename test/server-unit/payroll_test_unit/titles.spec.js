const { expect } = require('chai');
const sinon = require('sinon');

// Import the DB module to mock it
const db = require('../../../server/lib/db');

// Import the controller to test
const controller = require('../../../server/controllers/admin/titles');

describe('test/server-unit/payroll-test-unit/title_employee', () => {

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
  it('list() should return status 200 with the list of job titles', async () => {
    const titleData = [
      { id : 1, title_txt : 'Physiotherapist', is_medical : 1 },
      { id : 2, title_txt : 'Nurse', is_medical : 1 },
    ];

    sinon.stub(db, 'exec').returns(Promise.resolve(titleData));

    await controller.list(req, res, next);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(titleData)).to.equal(true);
  });

  // ---------------------------------------------------------
  it('detail() should return a title by ID', (done) => {
    const record = { id : 1, title_txt : 'Mechanic', is_medical : 0 };
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
    const insertResult = { insertId : 101 };
    sinon.stub(db, 'exec').resolves(insertResult);

    req.body = { title_txt : 'Pharmacist', is_medical : 1 };

    controller.create(req, res, next);

    setImmediate(() => {
      try {
        expect(db.exec.calledOnce).to.equal(true);
        expect(res.status.calledWith(201)).to.equal(true);
        expect(res.json.calledWith({ id : 101 })).to.equal(true);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('create() should call next(e) if the database throws an error', (done) => {
    const fakeError = new Error('SQL Error');
    sinon.stub(db, 'exec').rejects(fakeError);
    req.body = { title_txt : 'Accountant', is_medical : 0 };

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

  it('update() should modify and return the updated title', (done) => {
    const updated = { id : 10, title_txt : 'Imaging Technician', is_medical : 1 };

    sinon.stub(db, 'exec').resolves();
    sinon.stub(db, 'one').resolves(updated);

    req.params.id = 10;
    req.body = { title_txt : 'Imaging Technician' };

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
    expect(deleteStub.firstCall.args[0]).to.equal('title_employee');
    expect(deleteStub.firstCall.args[1]).to.equal('id');
    expect(deleteStub.firstCall.args[2]).to.equal(7);
  });

  it('delete() should call db.delete() even if the Title id is a string', () => {
    const deleteStub = sinon.stub(db, 'delete');
    req.params.id = 'str';

    controller.delete(req, res, next);

    expect(deleteStub.calledOnce).to.equal(true);
    expect(deleteStub.firstCall.args[0]).to.equal('title_employee');
    expect(deleteStub.firstCall.args[1]).to.equal('id');
    expect(deleteStub.firstCall.args[2]).to.equal('str');
  });
});
