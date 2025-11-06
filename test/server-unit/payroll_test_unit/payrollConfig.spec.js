const { expect } = require('chai');
const sinon = require('sinon');
const moment = require('moment');

// Import the database module
const db = require('../../../server/lib/db');

const util = require('../../../server/lib/util');

// Import the controller under test
const controller = require('../../../server/controllers/payroll/configuration');

describe('test/server-unit/payroll-test-unit/payrollConfiguration', () => {

  let req;
  let res;
  let next;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = { params : {}, body : {} };
    res = {
      status : sandbox.stub().returnsThis(),
      json : sandbox.stub(),
    };
    next = sandbox.spy();
  });

  afterEach(() => {
    sandbox.restore();
  });

  // ---------------------------------------------------------
  it('list() should return status 200 with the list of Payroll configurations', async () => {
    const PayrollConfigurations = [
      {
        id : 1,
        label : 'Payroll September 2025',
        dateFrom : '2025-09-01',
        dateTo : '2025-09-30',
        config_rubric_id : 1,
        config_accounting_id : 1,
        config_weekend_id : 1,
        config_employee_id : 1,
      },
      {
        id : 2,
        label : 'Payroll October 2025',
        dateFrom : '2025-10-01',
        dateTo : '2025-10-31',
        config_rubric_id : 1,
        config_accounting_id : 1,
        config_weekend_id : 1,
        config_employee_id : 1,
      },
    ];

    sandbox.stub(db, 'exec').resolves(PayrollConfigurations);

    await controller.list(req, res, next);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(PayrollConfigurations)).to.equal(true);
  });

  // ---------------------------------------------------------
  it('detail() should return a Payroll Configuration by ID', async () => {
    const record = { id : 1, label : 'Payroll September 2025' };
    sandbox.stub(db, 'one').resolves(record);
    req.params.id = 1;

    await controller.detail(req, res, next);

    expect(db.one.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(record)).to.equal(true);
  });

  it('detail() should throw if a DB error occurs', async () => {
    const fakeError = new Error('DB error');
    sandbox.stub(db, 'one').rejects(fakeError);
    req.params.id = 1;

    try {
      await controller.detail(req, res, next);
      expect.fail('Expected controller.detail() to throw an error');
    } catch (err) {
      expect(err).to.equal(fakeError);
    }
  });

  // ---------------------------------------------------------
  it('create() should insert a new configuration and update employees indices (full integration)', async () => {

    sandbox.stub(db, 'exec').callsFake((sql) => {
      if (sql.includes('FROM employee AS emp') && sql.includes('NOT IN (SELECT stf.employee_uuid')) {
        return Promise.resolve([{
          uuid : 'emp-1',
          hiring_date : '2020-01-01',
          value : 100,
          function_indice_value : 10,
          grade_uuid : 'grade-1',
          fonction_id : 1,
          display_name : 'John Doe',
        }]);
      }

      if (sql.includes('FROM employee AS emp')) {
        // oldEmployees
        return Promise.resolve([{
          uuid : 'emp-2',
          hiring_date : '2019-01-01',
          lastDateIncrease : '2023-01-01',
          grade_indice : 150,
          function_indice_value : 12,
          grade_uuid : 'grade-2',
          fonction_id : 2,
          display_name : 'Jane Smith',
        }]);
      }

      if (sql.includes('FROM enterprise_setting')) {
        // dataEnterprise
        return Promise.resolve([{ base_index_growth_rate : 1.1 }]);
      }
      return Promise.resolve([]);
    });

    const addQueryStub = sandbox.stub();
    const executeStub = sandbox.stub().resolves();
    sandbox.stub(db, 'transaction').returns({ addQuery : addQueryStub, execute : executeStub });

    sandbox.stub(db, 'uuid').returns('uuid-123');
    sandbox.stub(util, 'roundDecimal').callsFake(val => Math.round(val));
    sandbox.stub(moment.prototype, 'format').returns('2025-12-31');

    req.body = {
      label : 'Payroll December 2025',
      dateFrom : '2025-12-01',
      dateTo : '2025-12-31',
      config_rubric_id : 1,
      config_accounting_id : 1,
      config_weekend_id : 1,
      config_employee_id : 1,
    };

    await controller.create(req, res);

    expect(addQueryStub.called).to.equal(true);
    expect(executeStub.calledOnce).to.equal(true);
    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.called).to.equal(true);
  });

  // ---------------------------------------------------------
  it('update() should modify and return the updated Payroll configuration', async () => {
    const updated = { id : 12, label : 'DECEMBER 2025' };
    sandbox.stub(db, 'exec').resolves();
    sandbox.stub(db, 'one').resolves(updated);

    req.params.id = 12;
    req.body = { label : 'DECEMBER 2025' };

    await controller.update(req, res, next);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(updated)).to.equal(true);
  });

  it('update() should throw if a database error occurs', async () => {
    const fakeError = new Error('SQL Error');
    sandbox.stub(db, 'exec').rejects(fakeError);
    req.params.id = 10;

    try {
      await controller.update(req, res, next);
      expect.fail('Expected update() to throw an error');
    } catch (err) {
      expect(err).to.equal(fakeError);
    }
  });

  // ---------------------------------------------------------
  it('delete() should call db.delete() with the correct arguments', () => {
    const deleteStub = sandbox.stub(db, 'delete');
    req.params.id = 5;

    controller.delete(req, res, next);

    expect(deleteStub.calledOnce).to.equal(true);
    expect(deleteStub.firstCall.args[0]).to.equal('payroll_configuration');
    expect(deleteStub.firstCall.args[1]).to.equal('id');
    expect(deleteStub.firstCall.args[2]).to.equal(5);
  });

  it('deleteConfig() should call next() if delete fails', () => {
    const fakeError = new Error('Delete failed');

    const deleteStub = sandbox.stub(db, 'delete').callsFake(() => {
      next(fakeError);
    });

    req.params.id = 13;

    controller.delete(req, res, next);

    expect(deleteStub.calledOnce).to.equal(true);
    expect(next.calledOnce).to.equal(true);
    expect(next.firstCall.args[0].message).to.equal('Delete failed');
  });
});
