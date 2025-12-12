const { expect } = require('chai');
const sinon = require('sinon');
const db = require('../../../server/lib/db');
const controller = require('../../../server/controllers/payroll/weekendConfig');

describe('test/server-unit/payroll-test-unit/weekendConfig', () => {
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
  it('list() should return status 200 and list of weekend configs', async () => {
    const rows = [
      {
        id : 1,
        label : 'English Week Configuration',
      },
      {
        id : 2,
        label : 'French Week Configuration',
      },
    ];

    sinon.stub(db, 'exec').resolves(rows);

    await controller.list(req, res, next);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(rows)).to.equal(true);
  });

  it('list() should reject if DB fails', async () => {
    const fakeError = new Error('DB Error');
    sinon.stub(db, 'exec').rejects(fakeError);

    await expect(controller.list(req, res, next))
      .to.be.rejectedWith('DB Error');
  });

  // ------------------- DETAIL -------------------
  it('detail() should return weekend config detail', async () => {
    const record = { id : 1, label : 'English Week Configuration' };

    sinon.stub(db, 'one').resolves({ id : 1, label : 'English Week Configuration' });
    sinon.stub(db, 'exec').resolves([]);

    req.params.id = 2;
    await controller.detail(req, res, next);

    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledOnce).to.equal(true);
    expect(res.json.firstCall.args[0]).to.deep.equal(record);
  });

  it('detail() should reject if DB fails', async () => {
    sinon.stub(db, 'one').rejects(new Error('Failed'));
    req.params.id = 5;

    await expect(controller.detail(req, res, next))
      .to.be.rejectedWith('Failed');
  });

  // ------------------- CREATE -------------------
  it('create() should insert a new weekend config and return 201', async () => {
    sinon.stub(db, 'exec')
      .onFirstCall().resolves({ insertId : 5 })
      .onSecondCall()
      .resolves();

    req.body = {
      label : 'Arabic Week Configuration',
      daysChecked : [5, 6],
    };

    await controller.create(req, res, next);

    expect(db.exec.calledTwice).to.equal(true);
    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.calledWith({ id : 5 })).to.equal(true);
  });

  it('create() should work even if daysChecked is empty', async () => {
    sinon.stub(db, 'exec').resolves({ insertId : 9 });

    req.body = { label : 'Empty Config', daysChecked : [] };
    await controller.create(req, res, next);

    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.calledWith({ id : 9 })).to.equal(true);
  });

  it('create() should reject if DB fails', async () => {
    sinon.stub(db, 'exec').rejects(new Error('Insert failed'));
    req.body = { label : 'Bad Config', daysChecked : [1] };

    await expect(controller.create(req, res, next))
      .to.be.rejectedWith('Insert failed');
  });

  // ------------------- UPDATE -------------------
  it('update() should update weekend config and return full record', async () => {
    const sandbox = sinon.createSandbox();
    const fakeRecord = {
      id : 3,
      label : 'Updated Config',
      daysChecked : [5, 6, 0],
    };

    // Stub transaction
    const transactionStub = {
      addQuery : sandbox.stub().returnsThis(),
      execute : sandbox.stub().resolves(),
    };
    sandbox.stub(db, 'transaction').returns(transactionStub);

    // Stub db.one pour retourner le fakeRecord
    sandbox.stub(db, 'one').resolves(fakeRecord);

    req.params.id = 3;
    req.body = {
      label : 'Chinese Config',
      daysChecked : [3, 4, 5],
    };

    await controller.update(req, res, next);

    expect(db.transaction.called).to.equal(true);
    expect(transactionStub.addQuery.called).to.equal(true);
    expect(transactionStub.execute.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(fakeRecord)).to.equal(true);
    expect(next.called).to.equal(false);

    sandbox.restore();
  });

  it('update() should reject if DB error occurs', async () => {
    const sandbox = sinon.createSandbox();

    const fakeTransaction = {
      addQuery : sandbox.stub().returnsThis(),
      execute : sandbox.stub().rejects(new Error('Update failed')),
    };
    sandbox.stub(db, 'transaction').returns(fakeTransaction);

    req.params.id = 4;
    req.body = { label : 'Fail Config', daysChecked : [] };

    await expect(controller.update(req, res, next)).to.be.rejectedWith('Update failed');

    expect(next.called).to.equal(false);

    sandbox.restore();
  });

  // ------------------- DELETE -------------------
  it('delete() should remove weekend config and send 204', async () => {
    sinon.stub(db, 'delete').callsFake(() => {
      res.sendStatus(204);
    });

    req.params.id = 1;

    await controller.delete(req, res, next);

    expect(res.sendStatus.calledWith(204)).to.equal(true);

    sinon.restore();
  });

  it('delete() should call next(e) if deletion fails', async () => {
    const fakeError = new Error('Delete failed');
    sinon.stub(db, 'delete').callsFake(() => {
      next(fakeError);
    });

    req.params.id = 1;

    await controller.delete(req, res, next);

    expect(next.calledOnce).to.equal(true);
    expect(next.calledWith(fakeError)).to.equal(true);

    sinon.restore();
  });
});
