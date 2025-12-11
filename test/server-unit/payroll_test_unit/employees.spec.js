/* eslint-env mocha */
const { expect } = require('chai');
const sinon = require('sinon');
const db = require('../../../server/lib/db');
const NotFound = require('../../../server/lib/errors/NotFound');
const controller = require('../../../server/controllers/payroll/employees');

describe('test/server-unit/payroll-test-unit/employees', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params : {},
      query : {},
      body : {},
      session : { project : { id : 1 }, user : { id : 2 } },
    };
    res = { status : sinon.stub().returnsThis(), json : sinon.stub() };
  });

  afterEach(() => sinon.restore());

  // ---------------------------------------------------------------------
  // list()
  // ---------------------------------------------------------------------
  it('list() should return 200 with list of employees', async () => {
    const fakeEmployees = [{ uuid : 'AE053268FFD5ACD3FF0AF98F1456EA4E', display_name : 'John Doe' }];
    sinon.stub(db, 'exec').resolves(fakeEmployees);

    await controller.list(req, res);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(fakeEmployees)).to.equal(true);
  });

  // ---------------------------------------------------------------------
  // detail()
  // ---------------------------------------------------------------------
  it('detail() should return employee detail by uuid', async () => {
    const record = { uuid : 'A2BF379A7FC097855C02E4FE5BC16C4A', display_name : 'Jane Doe' };
    sinon.stub(db, 'one').resolves(record);
    req.params.uuid = 'A2BF379A7FC097855C02E4FE5BC16C4A';

    await controller.detail(req, res);

    expect(db.one.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(record)).to.equal(true);
  });

  // ---------------------------------------------------------------------
  // advantage()
  // ---------------------------------------------------------------------
  it('advantage() should return payroll advantages', async () => {
    const data = [{ rubric_payroll_id : 1, value : 200 }];
    sinon.stub(db, 'exec').resolves(data);
    req.params.uuid = 'abc';

    await controller.advantage(req, res);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(data)).to.equal(true);
  });

  // ---------------------------------------------------------------------
  // checkHoliday()
  // ---------------------------------------------------------------------
  it('checkHoliday() should query holidays and return result', async () => {
    const rows = [{ id : 1 }];
    sinon.stub(db, 'exec').resolves(rows);
    req.query = {
      employee_uuid : 'B1597655879827B4242ECFFB3403E927',
      dateFrom : '2025-01-01',
      dateTo : '2025-01-05',
      line : '',
    };

    await controller.checkHoliday(req, res);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(rows)).to.equal(true);
  });

  // ---------------------------------------------------------------------
  // checkOffday()
  // ---------------------------------------------------------------------
  it('checkOffday() should return offday conflicts', async () => {
    const rows = [{ id : 3 }];
    sinon.stub(db, 'exec').resolves(rows);
    req.query = { date : '2025-01-10', id : 5 };

    await controller.checkOffday(req, res);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(rows)).to.equal(true);
  });

  // ---------------------------------------------------------------------
  // listHolidays()
  // ---------------------------------------------------------------------
  it('listHolidays() should return holidays for employee', async () => {
    const rows = [{ id : 1, label : 'Vacation' }];
    sinon.stub(db, 'exec').resolves(rows);
    req.params.pp = JSON.stringify({ dateFrom : '2025-01-01', dateTo : '2025-01-31' });
    req.params.employee_uuid = '95A38C89C1B06443626841410B5C4E2A';

    await controller.listHolidays(req, res);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(rows)).to.equal(true);
  });

  // ---------------------------------------------------------------------
  // update() success
  // ---------------------------------------------------------------------
  it('update() should update an employee successfully', async () => {
    const fakeTransaction = {
      addQuery : sinon.stub().returnsThis(),
      execute : sinon.stub().resolves([{}, {}, {}, { affectedRows : 1 }]),
    };
    sinon.stub(db, 'transaction').returns(fakeTransaction);
    sinon.stub(db, 'one').resolves({ uuid : '9DF145008503DDFD114F715EC5326974' });

    req.params.uuid = '9DF145008503DDFD114F715EC5326974';
    req.body = { display_name : 'John', grade_uuid : 'g1' };

    await controller.update(req, res);

    expect(fakeTransaction.execute.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
  });

  // ---------------------------------------------------------------------
  // update() not found
  // ---------------------------------------------------------------------
  it('update() should throw NotFound if no employee updated', async () => {
    const fakeTransaction = {
      addQuery : sinon.stub().returnsThis(),
      execute : sinon.stub().resolves([{}, {}, {}, { affectedRows : 0 }]),
    };
    sinon.stub(db, 'transaction').returns(fakeTransaction);

    req.params.uuid = 'notfound';

    try {
      await controller.update(req, res);
      throw new Error('Expected NotFound not thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(NotFound);
    }
  });

  // ---------------------------------------------------------------------
  // create()
  // ---------------------------------------------------------------------
  it('create() should insert a new employee and return uuids', async () => {
    const fakeTransaction = {
      addQuery : sinon.stub().returnsThis(),
      execute : sinon.stub().resolves(),
    };
    sinon.stub(db, 'transaction').returns(fakeTransaction);
    sinon.stub(db, 'convert').callsFake((obj) => obj);
    req.body = { display_name : 'New Employee' };

    await controller.create(req, res);

    expect(fakeTransaction.addQuery.callCount).to.be.greaterThan(0);
    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.called).to.equal(true);
  });

  // ---------------------------------------------------------------------
  // patientToEmployee()
  // ---------------------------------------------------------------------
  it('patientToEmployee() should create employee from patient', async () => {
    const fakeTransaction = {
      addQuery : sinon.stub().returnsThis(),
      execute : sinon.stub().resolves(),
    };
    sinon.stub(db, 'transaction').returns(fakeTransaction);
    sinon.stub(db, 'convert').callsFake((obj) => obj);

    req.body = { patient_uuid : 'F9C7741FE7712F534F96ED7DEA654BB', display_name : 'Alice' };

    await controller.patientToEmployee(req, res);

    expect(fakeTransaction.addQuery.callCount).to.be.greaterThan(0);
    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.called).to.equal(true);
  });
});
