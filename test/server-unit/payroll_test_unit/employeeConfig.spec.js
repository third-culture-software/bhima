const { expect } = require('chai');
const sinon = require('sinon');
const db = require('../../../server/lib/db');

const NotFound = require('../../../server/lib/errors/NotFound');
const controller = require('../../../server/controllers/payroll/employeeConfig');

describe('test/server-unit/payroll-test-unit/employeeConfig', () => {
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
  it('list() should return status 200 and list of employee configs', async () => {
    const rows = [
      { id : 1, label : 'Config A', numEmployees : 2 },
      { id : 2, label : 'Config B', numEmployees : 0 },
    ];
    const totalEmployees = [{ totalEmployees : 5 }];

    // Stub des appels DB
    sinon.stub(db, 'exec')
      .onFirstCall()
      .resolves(rows)
      .onSecondCall()
      .resolves(totalEmployees);

    await controller.list(req, res);

    // Vérifications
    expect(db.exec.calledTwice).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);

    const expectedRows = rows.map(row => ({ ...row, totalEmployees : 5 }));
    expect(res.json.calledWith(expectedRows)).to.equal(true);
  });

  it('list() should reject if DB fails', async () => {
    const fakeError = new Error('DB Error');
    sinon.stub(db, 'exec').rejects(fakeError);

    await expect(controller.list(req, res, next))
      .to.be.rejectedWith('DB Error');
  });

  it('detail() should return weekend config detail', async () => {
    const record = { id : 1, label : 'Employee configuration 2024' };

    sinon.stub(db, 'one').resolves({ id : 1, label : 'Employee configuration 2024' });
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

  it('create() should insert a new employee config and return 201 with id', async () => {
    req.body = {
      label : 'Employee configuration 2027',
    };

    sinon.stub(db, 'exec').resolves({ insertId : 3 });

    await controller.create(req, res);

    expect(db.exec.calledOnce).to.equal(true);

    expect(db.exec.calledWithMatch(
      'INSERT INTO config_employee SET ?',
      sinon.match([{ label : 'Employee configuration 2027' }]),
    )).to.equal(true);

    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.calledWith({ id : 3 })).to.equal(true);
  });

  it('createConfig() should delete previous items and insert new configuration, then return 201', async () => {
    req.body = {
      configuration : [
        '0236AF7EBDF449B6A4F0309EC94BC92A',
        'BAABE3FDBD4445CF9732F57A6B00A79D',
        '4C2A9D29846341DDA601F5550EABE49E',
      ],
    };

    req.params.id = 42;
    res.sendStatus = sinon.stub();

    // Stub db.bid
    const bidStub = sinon.stub(db, 'bid');
    bidStub.withArgs('0236AF7EBDF449B6A4F0309EC94BC92A').returns('bid1');
    bidStub.withArgs('BAABE3FDBD4445CF9732F57A6B00A79D').returns('bid2');
    bidStub.withArgs('4C2A9D29846341DDA601F5550EABE49E').returns('bid3');

    // Stub transaction
    const executeStub = sinon.stub().resolves();
    const addQueryStub = sinon.stub().returnsThis();
    sinon.stub(db, 'transaction').returns({ addQuery : addQueryStub, execute : executeStub });

    await controller.createConfig(req, res);

    expect(db.transaction.calledOnce).to.equal(true);

    // DELETE
    expect(addQueryStub.calledWith(
      'DELETE FROM config_employee_item WHERE config_employee_id = ?;', [42])).to.equal(true);

    // INSERT
    const expectedData = [['bid1', 42], ['bid2', 42], ['bid3', 42]];
    expect(addQueryStub.calledWith(
      'INSERT INTO config_employee_item (employee_uuid, config_employee_id) VALUES ?', [expectedData])).to.equal(true);

    expect(executeStub.calledOnce).to.equal(true);

    // Statut HTTP
    expect(res.sendStatus.calledWith(201)).to.equal(true);
  });

  it('create() should reject if DB fails', async () => {
    sinon.stub(db, 'exec').rejects(new Error('Insert failed'));
    req.body = { label : 'Bad Config', configuration : ['F40B3859E623438BA2E994776E4CF8BC'] };

    await expect(controller.create(req, res, next))
      .to.be.rejectedWith('Insert failed');
  });

  it('update() should update Employee config and return full record', async () => {
    req.params.id = 3;
    req.body = { label : 'Employee Config' };

    res.status = sinon.stub().returnsThis();
    res.json = sinon.stub();

    const fakeRecord = { id : 3, label : 'Employee Config' };

    sinon.stub(db, 'convert').callsFake(body => body);

    const execStub = sinon.stub(db, 'exec');
    execStub.onFirstCall().resolves();
    execStub.onSecondCall().resolves([fakeRecord]);

    const originalLookup = controller.lookupEmployeeConfig;
    controller.lookupEmployeeConfig = async () => {
      const [row] = await db.exec();
      return row;
    };

    await controller.update(req, res, next);

    expect(execStub.calledTwice).to.equal(true);

    expect(execStub.firstCall.calledWithMatch(
      'UPDATE config_employee SET ? WHERE id = ?;',
      [sinon.match({ label : 'Employee Config' }), 3],
    )).to.equal(true);

    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(fakeRecord)).to.equal(true);
    expect(next.called).to.equal(false);

    controller.lookupEmployeeConfig = originalLookup;
  });

  it('update() should reject if DB error occurs', async () => {
    req.params.id = 4;
    req.body = { label : 'Fail Config' };

    res.status = sinon.stub().returnsThis();
    res.json = sinon.stub();

    sinon.stub(db, 'convert').callsFake(body => body);

    sinon.stub(db, 'exec').rejects(new Error('Update failed'));

    await controller.update(req, res, next).catch(err => {
      expect(err.message).to.equal('Update failed');
    });

    expect(res.status.called).to.equal(false);
    expect(res.json.called).to.equal(false);
  });

  it('delete() should remove employee config and send 204', async () => {
    const fakeTransaction = {
      addQuery : sinon.stub().returnsThis(),
      execute : sinon.stub().resolves([
        { affectedRows : 2 },
        { affectedRows : 1 },
      ]),
    };

    sinon.stub(db, 'transaction').returns(fakeTransaction);

    await controller.delete(req, res, next);

    expect(fakeTransaction.addQuery.calledTwice).to.equal(true);
    expect(res.sendStatus.calledWith(204)).to.equal(true);
    expect(next.called).to.equal(false);
  });

  it('Delete should throw NotFound if no rows are affected', async () => {
    const fakeTransaction = {
      addQuery : sinon.stub().returnsThis(),
      execute : sinon.stub().resolves([
        { affectedRows : 0 },
        { affectedRows : 0 },
      ]),
    };

    sinon.stub(db, 'transaction').callsFake(() => fakeTransaction);

    try {
      await controller.delete(req, res, next);

      throw new Error('Expected NotFound error but none thrown');
    } catch (err) {
      expect(err).to.be.instanceOf(NotFound);
      expect(err.description).to.include('Could not find an employee configuration');
      expect(err.status).to.equal(404);
      expect(res.sendStatus.called).to.equal(false);
      expect(next.called).to.equal(false);
    }
  });

  it('should throw error if DB transaction fails', async () => {
    const fakeError = new Error('DB failed');
    const fakeTransaction = {
      addQuery : sinon.stub().returnsThis(),
      execute : sinon.stub().rejects(fakeError),
    };

    sinon.stub(db, 'transaction').returns(fakeTransaction);

    try {
      await controller.delete(req, res, next);
      throw new Error('Expected DB error but none thrown');
    } catch (err) {
      expect(err).to.equal(fakeError);
      expect(res.sendStatus.called).to.equal(false);
      expect(next.called).to.equal(false);
    }
  });
});
