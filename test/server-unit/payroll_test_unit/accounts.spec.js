const { expect } = require('chai');
const sinon = require('sinon');

// Import the database module to mock it
const db = require('../../../server/lib/db');

const controller = require('../../../server/controllers/payroll/accounts');

describe('test/server-unit/payroll-test-unit/accounts', () => {

  // reusable mocks
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
    sinon.restore(); // reset everything after each test
  });

  it('list() should return a status 200 with the list of payroll accounts configuration', async () => {
    const accountsConfig = [
      {
        id : 1,
        label : 'Salary Account Configuration 2025',
        account_id : 220,
      },
      {
        id : 2,
        label : 'Salary Account Configuration 2026',
        account_id : 221,
      },
    ];

    sinon.stub(db, 'exec').resolves(accountsConfig);

    await controller.list(req, res, next);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(accountsConfig)).to.equal(true);
  });

  it('detail() must return a Account Configuration by Id', async () => {
    const record = { id : 1, label : 'Salary Account Configuration 2025' };
    sinon.stub(db, 'one').resolves(record);
    req.params.id = 26;

    await controller.detail(req, res, next);

    expect(db.one.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(record)).to.equal(true);
  });

  it('detail() should reject if a DB error occurs', async () => {
    const fakeError = new Error('DB error');
    sinon.stub(db, 'one').rejects(fakeError);
    req.params.id = 22;

    await expect(controller.detail(req, res, next))
      .to.be.rejectedWith('DB error');
  });

  // ---------------------------------------------------------
  it('create() must insert a new Account Configuration and return 201', async () => {
    const insertResult = { insertId : 5 };
    sinon.stub(db, 'exec').resolves(insertResult);

    req.body = {
      label : 'Salary Account Configuration 2027',
      account_id : 222,
    };

    await controller.create(req, res, next);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.calledWith({ id : 5 })).to.equal(true);
  });

  // ---------------------------------------------------------
  it('update() must modify and return the updated payroll accounts configuration', async () => {
    const updated = { id : 25, label : 'Salary Account Configuration', account_id : 219 };
    sinon.stub(db, 'exec').resolves();
    sinon.stub(db, 'one').resolves(updated);

    req.params.id = 25;
    req.body = { label : 'Salary Account Configuration', account_id : 219 };

    await controller.update(req, res, next);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(updated)).to.equal(true);
  });

  it('update() must reject if the database returns an error', async () => {
    const fakeError = new Error('Erreur SQL');
    sinon.stub(db, 'exec').rejects(fakeError);
    req.params.id = 10;
    req.body = { label : 'Test Config' };

    await expect(controller.update(req, res, next))
      .to.be.rejectedWith('Erreur SQL');
  });

  // ---------------------------------------------------------
  it('delete() must call db.delete() with the correct arguments', () => {
    const deleteStub = sinon.stub(db, 'delete');
    req.params.id = 25;

    controller.delete(req, res, next);

    expect(deleteStub.calledOnce).to.equal(true);
    expect(deleteStub.firstCall.args[0]).to.equal('config_accounting');
    expect(deleteStub.firstCall.args[1]).to.equal('id');
    expect(deleteStub.firstCall.args[2]).to.equal(25);
  });

  it('deleteConfig() should call next() if delete fails', () => {
    const fakeError = new Error('Delete failed');

    const deleteStub = sinon.stub(db, 'delete').callsFake(() => {
      next(fakeError);
    });

    req.params.id = 20;

    controller.delete(req, res, next);

    expect(deleteStub.calledOnce).to.equal(true);
    expect(next.calledOnce).to.equal(true);
    expect(next.firstCall.args[0].message).to.equal('Delete failed');
  });
});
