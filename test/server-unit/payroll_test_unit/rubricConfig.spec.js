const { expect } = require('chai');
const sinon = require('sinon');
const db = require('../../../server/lib/db');
const controller = require('../../../server/controllers/payroll/rubricConfig');

describe('test/server-unit/payroll-test-unit/rubricConfig', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { params : {}, body : {} };
    res = {
      status : sinon.stub().returnsThis(),
      json : sinon.stub(),
      sendStatus : sinon.stub(),
    };
    next = sinon.spy();
  });

  afterEach(() => sinon.restore());

  // ------------------- LIST -------------------
  it('list() should return status 200 and list of rubric configs', async () => {
    const rows = [
      {
        id : 1,
        label : 'Payroll configuration - November 2025',
      },
      {
        id : 2,
        label : 'Payroll configuration - December 2025',
      },
    ];

    sinon.stub(db, 'exec').resolves(rows);

    await controller.list(req, res, next);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(rows)).to.equal(true);
  });

  it('list() should call next(e) if DB fails', async () => {
    const fakeError = new Error('DB Error');
    sinon.stub(db, 'exec').rejects(fakeError);

    await controller.list(req, res, next);

    expect(next.calledWith(fakeError)).to.equal(true);
  });

  // ------------------- DETAIL -------------------
  it('detail() should return rubric config detail', async () => {
    const record = { id : 2, label : 'Payroll configuration - December 2025', items : [] };

    sinon.stub(db, 'one').resolves({ id : 2, label : 'Payroll configuration - December 2025' });
    sinon.stub(db, 'exec').resolves([]);

    req.params.id = 2;
    await controller.detail(req, res, next);

    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledOnce).to.equal(true);
    expect(res.json.firstCall.args[0]).to.deep.equal(record);
  });

  it('detail() should call next(e) on DB error', async () => {
    sinon.stub(db, 'one').rejects(new Error('Failed'));
    req.params.id = 5;

    await controller.detail(req, res, next);

    expect(next.calledOnce).to.equal(true);
  });

  // ------------------- CREATE -------------------
  it('create() should insert a new rubric config and return 201', async () => {
    sinon.stub(db, 'exec')
      .onFirstCall().resolves({ insertId : 5 })
      .onSecondCall()
      .resolves();

    req.body = {
      label : 'New Payroll configuration - December 2025',
      items : [10, 11],
    };

    await controller.create(req, res, next);

    expect(db.exec.calledTwice).to.equal(true);
    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.calledWith({ id : 5 })).to.equal(true);
  });

  it('create() should work even if items is empty', async () => {
    sinon.stub(db, 'exec').resolves({ insertId : 9 });

    req.body = { label : 'Empty Config', items : [] };
    await controller.create(req, res, next);

    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.calledWith({ id : 9 })).to.equal(true);
  });

  it('create() should call next(e) on DB error', async () => {
    sinon.stub(db, 'exec').rejects(new Error('Insert failed'));
    req.body = { label : 'Bad Config', items : [1] };

    await controller.create(req, res, next);

    expect(next.calledOnce).to.equal(true);
  });

  // ------------------- UPDATE -------------------
  it('update() should update rubric config and return full record', async () => {
    const sandbox = sinon.createSandbox();
    const fakeRecord = {
      id : 3,
      label : 'Updated Config',
      items : [3, 4, 5],
    };

    sandbox.stub(db, 'exec').resolves(fakeRecord.items);

    sandbox.stub(db, 'one').resolves({ id : 3, label : 'Updated Config' });

    const transactionStub = {
      addQuery : sandbox.stub().returnsThis(),
      execute : sandbox.stub().resolves(),
    };
    sandbox.stub(db, 'transaction').returns(transactionStub);

    req.params.id = 3;
    req.body = {
      label : 'Updated Config',
      items : [3, 4, 5],
    };

    await controller.update(req, res, next);

    // Assertions
    expect(db.one.called).to.equal(true);
    expect(db.exec.called).to.equal(true);
    expect(transactionStub.addQuery.called).to.equal(true);
    expect(transactionStub.execute.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(fakeRecord)).to.equal(true);
    expect(next.called).to.equal(false);

    sandbox.restore();
  });

  it('update() should call next(e) on DB error', async () => {
    sinon.stub(db, 'exec').rejects(new Error('Update failed'));
    req.params.id = 4;
    req.body = { label : 'Fail Config', items : [] };

    await controller.update(req, res, next);

    expect(next.calledOnce).to.equal(true);
  });

  // ------------------- DELETE -------------------
  it('delete() should remove rubric config and send 204', async () => {
    sinon.stub(db, 'one').resolves({ id : 1, label : 'Config' });
    sinon.stub(db, 'exec').resolves();
    sinon.stub(db, 'transaction').returns({
      addQuery : sinon.stub().returnsThis(),
      execute : sinon.stub().resolves(),
    });

    req.params.id = 1;
    await controller.delete(req, res, next);

    expect(res.sendStatus.calledWith(204)).to.equal(true);
  });

  it('delete() should call next(e) if deletion fails', async () => {
    sinon.stub(db, 'one').rejects(new Error('DB missing'));
    req.params.id = 1;

    await controller.delete(req, res, next);

    expect(next.calledOnce).to.equal(true);
  });
});
