const { expect } = require('chai');
const sinon = require('sinon');
const db = require('../../../server/lib/db');
const Exchange = require('../../../server/controllers/finance/exchange');
const payrollSettings = require('../../../server/controllers/payroll/multiplePayroll/payrollSettings');

describe('test/server-unit/payroll-test-unit/Multiple Payroll SetConfiguration Controller', () => {
  let sandbox;
  let req;
  let res;
  let next;
  let configController;
  let transactionAddQueryStub;
  let transactionExecuteStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Stub DB
    sandbox.stub(db, 'one').callsFake(async () => ({
      id : 123,
      dateFrom : '2025-10-01',
      dateTo : '2025-10-31',
      config_ipr_id : 1,
      currency_id : 1,
    }));

    sandbox.stub(db, 'exec').callsFake(async () => [
      {
        id : 1,
        rubric_payroll_id : 1,
        debtor_account_id : 1,
        expense_account_id : 1,
      }]);

    // Stub Exchange
    sandbox.stub(Exchange, 'getExchangeRate').resolves(1);

    // Stub payrollSettings
    sandbox.stub(payrollSettings, 'setConfig').resolves([
      [{ query : 'SQL1', params : [] }, { query : 'SQL2', params : [] }],
    ]);

    // Stub transaction
    transactionExecuteStub = sandbox.stub().resolves();
    transactionAddQueryStub = sandbox.stub();
    sandbox.stub(db, 'transaction').returns({
      addQuery : transactionAddQueryStub,
      execute : transactionExecuteStub,
    });

    // Reload controller
    delete require.cache[require.resolve('../../../server/controllers/payroll/multiplePayroll/setMultiConfiguration')];
    // eslint-disable-next-line global-require
    configController = require('../../../server/controllers/payroll/multiplePayroll/setMultiConfiguration').config;

    // Mock req/res/next
    req = {
      body : { data : { employees : ['emp1', 'emp2'], currencyId : 1 } },
      params : { id : 123 },
      session : { enterprise : { id : 1, currency_id : 1 } },
    };
    res = { sendStatus : sandbox.stub() };
    next = sandbox.stub();
  });

  afterEach(() => sandbox.restore());

  it('should execute all payroll transactions and return 201', async () => {
    await configController(req, res, next);

    expect(transactionAddQueryStub.called, 'No query added to the transaction').to.equal(true);
    expect(transactionExecuteStub.calledOnce, 'Transaction was not executed').to.equal(true);
    expect(res.sendStatus.calledWith(201), 'HTTP 201 not returned').to.equal(true);
    expect(next.called, 'next() should not be called').to.equal(false);
  });

  it('should call next(err) if any error occurs', async () => {
    // Simulate an error in db.one
    db.one.restore();
    sandbox.stub(db, 'one').callsFake(async () => { throw new Error('DB failure'); });

    await configController(req, res, next);

    expect(next.calledOnce, 'next() was not called on error').to.equal(true);
    expect(next.firstCall.args[0]).to.be.an('error');
    expect(res.sendStatus.called, 'sendStatus should not be called').to.equal(false);
  });
});
