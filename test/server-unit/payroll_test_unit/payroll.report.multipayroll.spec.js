/* eslint-env mocha */
const { expect } = require('chai');
const sinon = require('sinon');
const Module = require('module');
const path = require('path');
const { createRequire } = require('module');
const fs = require('fs');

describe('test/server-unit/payroll-test-unit/payroll/reports/multiplePayroll', () => {
  let build;
  let Payroll;
  let PayrollConfig;
  let shared;
  let ReportManagerStub;
  let req;
  let res;

  beforeEach(() => {
    const isolatedRequire = createRequire(__dirname);

    // Load isolated backend modules
    Payroll = isolatedRequire(path.resolve(__dirname, '../../../server/controllers/payroll/multiplePayroll'));
    PayrollConfig = isolatedRequire(path.resolve(__dirname, '../../../server/controllers/payroll/configuration'));
    shared = isolatedRequire(path.resolve(__dirname, '../../../server/controllers/finance/reports/shared'));

    // Disable loadDictionary for translations
    const util = isolatedRequire(path.resolve(__dirname, '../../../server/lib/util'));
    sinon.stub(util, 'loadDictionary').callsFake(() => ({}));

    // Stub fs.readFileSync only for frontend CSS
    const originalReadFileSync = fs.readFileSync;
    sinon.stub(fs, 'readFileSync').callsFake((filePath, ...args) => {
      if (filePath.endsWith('bhima-bootstrap.css')) return '/* CSS factice pour test */';
      return originalReadFileSync.call(fs, filePath, ...args);
    });

    // Stubs backend
    sinon.stub(Payroll, 'find').resolves([{ employee : 'John Doe' }]);
    sinon.stub(PayrollConfig, 'lookupPayrollConfig').resolves({ label : 'Test Payroll' });
    sinon.stub(shared, 'formatFilters').returns([{ key : 'department', value : 'IT' }]);

    // Complete ReportManager Stub
    const renderStub = sinon.stub().resolves({
      headers : { 'Content-Type' : 'application/pdf' },
      report : Buffer.from('PDFCONTENT'),
    });
    ReportManagerStub = sinon.stub().callsFake(() => ({ render : renderStub }));

    // Stub require to inject stubbed ReportManager
    const originalRequire = Module.prototype.require;
    // eslint-disable-next-line func-names, no-shadow
    sinon.stub(Module.prototype, 'require').callsFake(function (path) {
      if (path.endsWith('ReportManager')) return ReportManagerStub;
      return originalRequire.call(this, path);
    });

    // Load the patched controller
    build = isolatedRequire(path.resolve(__dirname, '../../../server/controllers/payroll/reports/multipayroll'));

    // Mocks HTTP
    req = {
      query : {
        payroll_configuration_id : 123, idPeriod : '4', lang : 'fr', renderer : 'pdf',
      },
      session : {
        cookie : {
          path : '/', _expires : null, originalMaxAge : null, httpOnly : true,
        },
        path : '/',
        user : 'tester',
        enterprise : {
          id : 1, name : 'Test Enterprise', logo : './client/assets/logo.png', logopath : '/',
        },
      },
    };

    res = { set : sinon.stub().returnsThis(), send : sinon.stub() };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should build and send a payroll report successfully', async () => {
    await build(req, res);

    // Backend checks
    expect(shared.formatFilters.calledOnce).to.equal(true);
    expect(PayrollConfig.lookupPayrollConfig.calledOnceWith(123)).to.equal(true);
    expect(Payroll.find.calledOnce).to.equal(true);

    // Checking that ReportManager has been instantiated and render called
    expect(ReportManagerStub.calledOnce).to.equal(true);
    const reportManagerInstance = ReportManagerStub.firstCall.returnValue;
    expect(reportManagerInstance.render.calledOnce).to.equal(true);

    // PDF verification sent
    expect(res.set.calledOnceWith({ 'Content-Type' : 'application/pdf' })).to.equal(true);
    expect(res.send.calledOnce).to.equal(true);
  });
});
