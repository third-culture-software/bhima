const { expect } = require('chai');
const sinon = require('sinon');

// Import the DB module to mock it
const db = require('../../../server/lib/db');

// Import the controller to test
const controller = require('../../../server/controllers/admin/offdays');

describe('test/server-unit/payroll-test-unit/offdays', () => {
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
    sinon.restore(); // reset mocks after each test
  });

  // --------------------------------------------------------
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

    sinon.stub(db, 'exec').resolves(offdayData);

    await controller.list(req, res);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(offdayData)).to.equal(true);
  });

  // ---------------------------------------------------------
  it('detail() must return a offday by ID', async () => {
    const record = {
      id           : 3,
      label        : 'Fish Festival',
      date         : '2025-04-01',
      percent_pay  : 80,
    };

    sinon.stub(db, 'one').resolves(record);
    req.params.id = 3;

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

  it('create() should insert a new title and return 201', async () => {
    const insertResult = { insertId : 10 };
    sinon.stub(db, 'exec').resolves(insertResult);

    req.body = {
      label        : 'United States Independence Day',
      date         : '2025-07-04',
      percent_pay  : 100,
    };

    await controller.create(req, res);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.calledWith({ id : 10 })).to.equal(true);
  });

  it('create() should throw an error if the database throws an error', async () => {
    const fakeError = new Error('SQL Error');
    sinon.stub(db, 'exec').rejects(fakeError);
    req.body = { label : 'Easter Monday', percent_pay : 35 };

    try {
      await controller.create(req, res);
      throw new Error('Expected error was not thrown');
    } catch (err) {
      expect(err).to.equal(fakeError);
    }
  });

  // ---------------------------------------------------------
  it('update() should modify and return the updated offday', async () => {
    const updated = { id : 1, label : 'Lumumba Day Commemoration' };

    sinon.stub(db, 'exec').resolves();
    sinon.stub(db, 'one').resolves(updated);

    req.params.id = 1;
    req.body = { label : 'Lumumba Day Commemoration' };

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
  it('delete() should call db.delete() with the correct arguments', async () => {
    const deleteStub = sinon.stub(db, 'delete');
    req.params.id = 7;

    await controller.delete(req, res);

    expect(deleteStub.calledOnce).to.equal(true);
    expect(deleteStub.firstCall.args[0]).to.equal('offday');
    expect(deleteStub.firstCall.args[1]).to.equal('id');
    expect(deleteStub.firstCall.args[2]).to.equal(7);
  });

  it('delete() should call db.delete() even if the Offday id is a string', async () => {
    const deleteStub = sinon.stub(db, 'delete');
    req.params.id = 'str';

    await controller.delete(req, res);

    expect(deleteStub.calledOnce).to.equal(true);
    expect(deleteStub.firstCall.args[0]).to.equal('offday');
    expect(deleteStub.firstCall.args[1]).to.equal('id');
    expect(deleteStub.firstCall.args[2]).to.equal('str');
  });
});
