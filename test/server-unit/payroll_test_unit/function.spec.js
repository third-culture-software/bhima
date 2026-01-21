const { expect } = require('chai');
const sinon = require('sinon');

// Import the database module to mock it
const db = require('../../../server/lib/db');

const controller = require('../../../server/controllers/admin/functions');

describe('test/server-unit/payroll-test-unit/function', () => {

  // reusable mocks
  let req;
  let res;

  beforeEach(() => {
    req = { params : {}, body : {} };
    res = {
      status : sinon.stub().returnsThis(),
      json : sinon.stub(),
    };
  });

  afterEach(() => {
    sinon.restore(); // reset everything after each test
  });

  it('list() should return a status 200 with the list of functions', async () => {
    const fonctionData = [
      { id : 1, fonction_txt : 'Medecin', numEmployees : 4 },
      { id : 2, fonction_txt : 'Infirmier', numEmployees : 3 },
    ];

    sinon.stub(db, 'exec').resolves(fonctionData);

    await controller.list(req, res);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(fonctionData)).to.equal(true);
  });

  it('detail() must return a function by Id', async () => {
    const record = { id : 1, fonction_txt : 'Chirurgien' };
    sinon.stub(db, 'one').resolves(record);
    req.params.id = 1;

    await controller.detail(req, res);

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

  // ---------------------------------------------------------
  it('create() must insert a new function and return 201', async () => {
    const insertResult = { insertId : 99 };
    sinon.stub(db, 'exec').resolves(insertResult);

    req.body = { fonction_txt : 'Radiologue' };

    await controller.create(req, res);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.calledWith({ id : 99 })).to.equal(true);
  });

  // ---------------------------------------------------------
  it('update() must modify and return the updated function', async () => {
    const updated = { id : 10, fonction_txt : 'Biologiste' };
    sinon.stub(db, 'exec').resolves();
    sinon.stub(db, 'one').resolves(updated);

    req.params.id = 10;
    req.body = { fonction_txt : 'Biologiste' };

    await controller.update(req, res);

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
  it('delete() must call db.delete() with the correct arguments', async () => {
    const deleteStub = sinon.stub(db, 'delete');
    req.params.id = 5;

    await controller.delete(req, res);

    expect(deleteStub.calledOnce).to.equal(true);
    expect(deleteStub.firstCall.args[0]).to.equal('fonction');
    expect(deleteStub.firstCall.args[1]).to.equal('id');
    expect(deleteStub.firstCall.args[2]).to.equal(5);
  });
});
