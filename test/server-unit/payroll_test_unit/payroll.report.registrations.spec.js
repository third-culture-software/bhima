const { expect } = require('chai');
const sinon = require('sinon');

const build = require('../../../server/controllers/payroll/reports/registrations');
const ReportManager = require('../../../server/lib/ReportManager');
const Employees = require('../../../server/controllers/payroll/employees');
const db = require('../../../server/lib/db');

describe('test/unit/payroll/reports/registrations', () => {
  let req;
  let res;

  // Dummy employee data
  const employeesFake = [
    {
      uuid : 'EMP001',
      reference : 1,
      display_name : 'Alice',
      dob : '1990-01-01',
      sex : 'F',
      patient_uuid : 'PAT001',
    },
    {
      uuid : 'EMP002',
      reference : 2,
      display_name : 'Bob',
      dob : '1985-05-20',
      sex : 'M',
      patient_uuid : 'PAT002',
    },
  ];

  // Dummy aggregate data
  const aggregatesFake = {
    numEmployees : 2,
    numFemales : 1,
    percentFemales : 50,
    numMales : 1,
    percentMales : 50,
  };

  beforeEach(() => {
    req = {
      query : {
        displayValues : 'display_name :test',
        display_name : 'test',
        lang : 'fr',
        limit : '1000',
        renderer : 'pdf',
      },
      session : { user : { id : 1 } },
    };

    res = {
      set : sinon.stub().returnsThis(),
      send : sinon.stub(),
    };

    // Stub Employees.find to return fake employees
    sinon.stub(Employees, 'find').resolves(employeesFake);

    // Stub db.one to return fake aggregates
    sinon.stub(db, 'one').resolves(aggregatesFake);

    // Stub ReportManager.render to return fake PDF
    sinon.stub(ReportManager.prototype, 'render').resolves({
      headers : { 'Content-Type' : 'application/pdf' },
      report : 'fake-pdf-content',
    });

    // Stub db.bid for UUID conversion
    sinon.stub(db, 'bid').callsFake(uuid => uuid);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should build a PDF report of employee registrations', async () => {
    await build(req, res);

    // Check that Employees.find was called with options
    expect(Employees.find.calledOnce).to.equal(true);

    // Check that db.one was called with the correct UUIDs
    const uuidsCalled = db.one.firstCall.args[1][0];
    expect(uuidsCalled).to.deep.equal(['EMP001', 'EMP002']);

    // Check that ages were calculated
    employeesFake.forEach(emp => {
      expect(emp.age).to.be.a('number');
    });

    // Check that ReportManager.render was called with correct data
    const renderData = ReportManager.prototype.render.firstCall.args[0];
    expect(renderData.employees).to.deep.equal(employeesFake);
    expect(renderData.aggregates).to.deep.equal(aggregatesFake);

    // Check that response headers and send were called
    expect(res.set.calledOnce).to.equal(true);
    expect(res.send.calledOnce).to.equal(true);
    expect(res.send.firstCall.args[0]).to.equal('fake-pdf-content');
  });

  it('should handle empty employee list', async () => {
    Employees.find.resolves([]);

    await build(req, res);

    const renderData = ReportManager.prototype.render.firstCall.args[0];
    expect(renderData.employees).to.deep.equal([]);
    // eslint-disable-next-line no-unused-expressions
    expect(renderData.aggregates).to.exist;
    expect(res.send.calledOnce).to.equal(true);
  });
});
