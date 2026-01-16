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

  it('detail() should return a title by ID', async () => {
    const record = { id : 1, title_txt : 'Mechanic', is_medical : 0 };
    sinon.stub(db, 'one').resolves(record);
    req.params.id = 1;

    await controller.detail(req, res, next);

    expect(db.one.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(record)).to.equal(true);
  });

  it('detail() should throw if a DB error occurs', async () => {
    const fakeError = new Error('DB error');
    sinon.stub(db, 'one').rejects(fakeError);
    req.params.id = 1;

    try {
      await controller.detail(req, res);
      throw new Error('Expected error was not thrown');
    } catch (err) {
      expect(err).to.equal(fakeError);
    }
  });

  it('create() should insert a new title and return 201', async () => {
    const insertResult = { insertId : 101 };
    sinon.stub(db, 'exec').resolves(insertResult);

    req.body = { title_txt : 'Pharmacist', is_medical : 1 };

    await controller.create(req, res, next);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.calledWith({ id : 101 })).to.equal(true);
  });

  it('create() should  throws an error', async () => {
    const fakeError = new Error('SQL Error');
    sinon.stub(db, 'exec').rejects(fakeError);
    req.body = { title_txt : 'Accountant', is_medical : 0 };

    try {
      await controller.create(req, res);
      throw new Error('Expected error was not thrown');
    } catch (err) {
      expect(err).to.equal(fakeError);
    }
  });

  it('update() should modify and return the updated title', async () => {
    const updated = { id : 10, title_txt : 'Imaging Technician', is_medical : 1 };

    sinon.stub(db, 'exec').resolves();
    sinon.stub(db, 'one').resolves(updated);

    req.params.id = 10;
    req.body = { title_txt : 'Imaging Technician' };

    await controller.update(req, res, next);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(updated)).to.equal(true);
  });

  it('update() should throws an error', async () => {
    const fakeError = new Error('SQL Error');
    sinon.stub(db, 'exec').rejects(fakeError);
    req.params.id = 10;

    try {
      await controller.detail(req, res);
      throw new Error('Expected error was not thrown');
    } catch (err) {
      expect(err).to.equal(fakeError);
    }
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
