const { expect } = require('chai');
const sinon = require('sinon');

// Import the find module and stub before loading the controller
const findModule = require('../../../server/controllers/payroll/multiplePayroll/find');

const findStub = sinon.stub(findModule, 'find');

// Import the controller after stubbing
const controller = require('../../../server/controllers/payroll/multiplePayroll');

describe('test/server-unit/payroll-test-unit/multiplePayroll/search', () => {
  let res;
  let next;

  beforeEach(() => {
    // Mock the response and next middleware for each test
    res = {
      status : sinon.stub().returnsThis(),
      json : sinon.stub(),
    };
    next = sinon.stub();

    // Reset the stub history before each test
    findStub.resetHistory();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return 200 and rows from find()', (done) => {
    const req = {
      query : {
        client_timestamp : '2025-10-16T13:13:00.291Z',
        conversion_rate : '2800',
        currency_id : '1',
        displayValues : 'status_id:undefined,conversion_rate:undefined',
        payroll_configuration_id : 4,
        status_id : [1, 3],
      },
    };

    const fakeRows = [
      { employee_uuid : '123', display_name : 'John Doe', status_id : 1 },
      { employee_uuid : '456', display_name : 'Jane Smith', status_id : 3 },
    ];

    // Stub find() to return fakeRows
    findStub.resolves(fakeRows);

    // Call the controller function
    controller.search(req, res, next);

    setImmediate(() => {
      // Verify that find() was called once
      expect(findStub.calledOnce).to.equal(true);

      // Verify that find() was called with the correct query object
      const callArg = findStub.getCall(0).args[0];
      expect(callArg.payroll_configuration_id).to.equal(4);
      expect(callArg.status_id).to.deep.equal([1, 3]);

      // Verify the HTTP response
      expect(res.status.calledOnceWithExactly(200)).to.equal(true);
      expect(res.json.calledOnceWithExactly(fakeRows)).to.equal(true);

      // Verify that next() was not called
      expect(next.notCalled).to.equal(true);

      done();
    });
  });

  it('should call next(err) if find() rejects', (done) => {
    const req = {
      query : {
        client_timestamp : '2025-10-16T13:13:00.291Z',
        conversion_rate : 2800,
        currency_id : 1,
        displayValues : 'status_id:undefined,conversion_rate:undefined',
        payroll_configuration_id : 4,
        status_id : [1, 3],
      },
    };

    const fakeError = new Error('DB error');
    findStub.rejects(fakeError);

    // Call the controller
    controller.search(req, res, next);

    setImmediate(() => {
      // Verify that next() was called with the error
      expect(next.calledOnceWithExactly(fakeError)).to.equal(true);

      // Verify that no response was sent
      expect(res.status.notCalled).to.equal(true);
      expect(res.json.notCalled).to.equal(true);

      done();
    });
  });
});
