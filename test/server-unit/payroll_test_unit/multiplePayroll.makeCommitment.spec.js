const { expect } = require('chai');
const sinon = require('sinon');
const db = require('../../../server/lib/db');
const Exchange = require('../../../server/controllers/finance/exchange');
const CostCenter = require('../../../server/controllers/finance/cost_center');

describe('test/server-unit/payroll-test-unit/Multiple Payroll Commitment Controller (debug mode)', () => {
  let sandbox;
  let req;
  let res;
  let next;
  let config;
  let transactionAddQueryStub;
  let transactionExecuteStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Step 1: Dependency Stubs
    sandbox.stub(db, 'exec').callsFake(async () => {
      return [];
    });

    sandbox.stub(db, 'one').callsFake(async () => {
      return {
        id : 123,
        label : 'Payroll Test',
        config_accounting_id : 1,
        dateTo : '2025-10-18',
      };
    });

    sandbox.stub(Exchange, 'getCurrentExchangeRateByCurrency')
      .callsFake(async () => {
        return [{ currency : 1, rate : 1 }];
      });

    sandbox.stub(CostCenter, 'getAllCostCenterAccounts')
      .callsFake(async () => {
        return [{ id : 1, account_id : 1 }];
      });

    // Step 2: Key Function Stubs
    // eslint-disable-next-line global-require
    const commitmentModule = require('../../../server/controllers/payroll/multiplePayroll/commitment');
    // eslint-disable-next-line global-require
    const groupedModule = require('../../../server/controllers/payroll/multiplePayroll/groupedCommitment');
    // eslint-disable-next-line global-require
    const employeeModule = require('../../../server/controllers/payroll/multiplePayroll/commitmentByEmployee');

    sandbox.stub(commitmentModule, 'commitments')
      .callsFake(() => {
        return [{ query : 'SQL1', params : [] }];
      });

    sandbox.stub(groupedModule, 'groupedCommitments')
      .callsFake(() => {
        return [{ query : 'SQL2', params : [] }];
      });

    sandbox.stub(employeeModule, 'commitmentByEmployee')
      .callsFake(() => {
        return [{ query : 'SQL3', params : [] }];
      });

    // Step 3: Force reload the controller
    delete require.cache[require.resolve('../../../server/controllers/payroll/multiplePayroll/makeCommitment')];
    // eslint-disable-next-line global-require
    config = require('../../../server/controllers/payroll/multiplePayroll/makeCommitment').config;

    // Step 4: Mock the DB transaction
    transactionExecuteStub = sandbox.stub().resolves();
    transactionAddQueryStub = sandbox.stub();

    sandbox.stub(db, 'transaction').returns({
      addQuery : transactionAddQueryStub,
      execute : transactionExecuteStub,
    });

    // Step 5: mock req/res/next
    req = {
      body : { data : ['uuid1', 'uuid2'] },
      params : { id : 123 },
      session : {
        project : { id : 1 },
        user : { id : 2 },
        enterprise : {
          currency_id : 1,
          settings : {
            posting_payroll_cost_center_mode : 'default',
            pension_transaction_type_id : 5,
          },
        },
      },
      query : { lang : 'en' },
    };
    res = { sendStatus : sandbox.stub() };
    next = sandbox.stub();
  });

  afterEach(() => sandbox.restore());

  it('should call the default commitments function and execute transaction', async () => {
    await config(req, res, next);

    expect(transactionAddQueryStub.called, 'No query added to the transaction').to.equal(true);
    expect(transactionExecuteStub.calledOnce, 'Transaction was not executed').to.equal(true);
    expect(res.sendStatus.calledWith(201), 'HTTP 201 not returned').to.equal(true);
    expect(next.called, 'next() should not be called').to.equal(false);
  });
});
