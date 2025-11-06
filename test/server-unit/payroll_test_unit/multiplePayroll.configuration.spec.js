const { expect } = require('chai');
const sinon = require('sinon');

// Importing internal modules used by the controller
const getConfigModule = require('../../../server/controllers/payroll/multiplePayroll/getConfig');
const manageConfig = require('../../../server/controllers/payroll/multiplePayroll/manageConfig');

// These variables will be reassigned in beforeEach()
let getConfigurationDataStub;
let manageConfigurationDataStub;
let controller;

describe('test/server-unit/payroll-test-unit/multiplePayroll/multiplePayroll.configuration()', () => {
  let res;
  let next;

  beforeEach(() => {
    // Important: clear the controller cache before each test
    delete require.cache[require.resolve('../../../server/controllers/payroll/multiplePayroll')];

    // Create new stubs for each test
    getConfigurationDataStub = sinon.stub(getConfigModule, 'getConfigurationData');
    manageConfigurationDataStub = sinon.stub(manageConfig, 'manageConfigurationData');

    // Import the controller AFTER the stubs are created
    // eslint-disable-next-line global-require
    controller = require('../../../server/controllers/payroll/multiplePayroll');

    // Mock the res and next() objects
    res = {
      status : sinon.stub().returnsThis(),
      json : sinon.stub(),
    };
    next = sinon.stub();
  });

  afterEach(() => {
    // Restore all stubs and clear the controller cache after each test
    sinon.restore();
    delete require.cache[require.resolve('../../../server/controllers/payroll/multiplePayroll')];
  });

  it('should return 200 and managed rows from configuration()', (done) => {
    const req = {
      params : { id : 10 },
      query : {
        dateFrom : '2025-10-01',
        dateTo : '2025-10-31',
        employeeUuid : '50E52ADE97334B479CEADCB74471AEDD',
      },
    };

    const fakeRows = [['rubric1'], ['offday1'], ['holiday1']];
    const fakeManaged = { rubrics : ['rubric1'], offdays : ['offday1'], holidays : ['holiday1'] };

    getConfigurationDataStub.resolves(fakeRows);
    manageConfigurationDataStub.returns(fakeManaged);

    controller.configuration(req, res, next);

    setImmediate(() => {
      // Check that the data retrieval function was called
      expect(getConfigurationDataStub.calledOnce).to.equal(true);
      expect(getConfigurationDataStub.getCall(0).args[0]).to.equal(10);
      expect(getConfigurationDataStub.getCall(0).args[1]).to.deep.equal(req.query);

      // Check that the data processing function was called correctly
      expect(manageConfigurationDataStub.calledOnceWithExactly(fakeRows, req.query)).to.equal(true);

      // Check the HTTP response
      expect(res.status.calledOnceWithExactly(200)).to.equal(true);
      expect(res.json.calledOnceWithExactly(fakeManaged)).to.equal(true);

      // Check that no errors were propagated
      expect(next.notCalled).to.equal(true);

      done();
    });
  });

  it('should call next(err) if getConfigurationData rejects', (done) => {
    const req = {
      params : { id : 10 },
      query : {
        dateFrom : '2025-10-01',
        dateTo : '2025-10-31',
      },
    };

    const fakeError = new Error('DB error');
    getConfigurationDataStub.rejects(fakeError);

    controller.configuration(req, res, next);

    setImmediate(() => {
      // Check that next() was called with the error
      expect(next.calledOnceWithExactly(fakeError)).to.equal(true);

      // Check that no HTTP response was sent
      expect(res.status.notCalled).to.equal(true);
      expect(res.json.notCalled).to.equal(true);

      done();
    });
  });
});
