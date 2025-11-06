/* eslint-env mocha */
const { expect } = require('chai');
const sinon = require('sinon');

// Import the module to be tested
const moduleUnderTest = require('../../../server/controllers/payroll/staffingIndices/report');

// Import dependencies used in the function
const staffing = require('../../../server/controllers/payroll/staffingIndices/index');
const shared = require('../../../server/controllers/finance/reports/shared');
const ReportManager = require('../../../server/lib/ReportManager');

describe('test/server-unit/payroll-test-unit/staffingIndices', () => {
  let req;
  let res;
  let reportRenderStub;
  let setStub;
  let sendStub;

  beforeEach(() => {
    // Simulate Express request and response objects
    req = {
      query : { year : '2025' },
      session : { user : { id : 1 } },
    };

    setStub = sinon.stub().returnsThis();
    sendStub = sinon.stub();

    res = {
      set : setStub,
      send : sendStub,
    };

    // Stub dependencies
    sinon.stub(shared, 'formatFilters').returns({ year : '2025' });
    sinon.stub(staffing, 'lookUp').resolves([{ uuid : 'A1', name : 'Test' }]);

    reportRenderStub = sinon.stub().resolves({
      headers : { 'Content-Type' : 'application/pdf' },
      report : Buffer.from('FAKEPDF'),
    });
    sinon.stub(ReportManager.prototype, 'render').callsFake(reportRenderStub);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should generate a PDF report with the correct parameters', async () => {
    await moduleUnderTest.document(req, res);

    // Verify that dependencies are called correctly
    expect(shared.formatFilters.calledOnce).to.equal(true);
    expect(staffing.lookUp.calledOnce).to.equal(true);
    expect(ReportManager.prototype.render.calledOnce).to.equal(true);

    // Verify that the HTTP response is correct
    expect(setStub.calledWith({ 'Content-Type' : 'application/pdf' })).to.equal(true);
    expect(sendStub.calledWith(Buffer.from('FAKEPDF'))).to.equal(true);
  });

  it('should propagate an error if staffing.lookUp fails', async () => {
    staffing.lookUp.rejects(new Error('DB failed'));

    let caughtError;
    try {
      await moduleUnderTest.document(req, res);
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).to.be.instanceOf(Error);
    expect(caughtError.message).to.equal('DB failed');
  });

  it('should include req.query options in the report', async () => {
    req.query.orientation = 'portrait';
    await moduleUnderTest.document(req, res);

    // Verify that formatFilters received the merged options
    const calledOptions = shared.formatFilters.firstCall.args[0];

    expect(calledOptions).to.include({
      orientation : 'landscape',
      suppressDefaultFiltering : true,
      year : '2025',
    });
  });
});
