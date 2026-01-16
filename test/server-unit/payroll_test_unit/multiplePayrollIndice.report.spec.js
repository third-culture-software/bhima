/**
 * Unit tests for multiplePayrollIndice report controller
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Controller under test
const reportController = require('../../../server/controllers/payroll/multiplePayrollIndice/report');

// Dependencies to stub
const multipayIndice = require('../../../server/controllers/payroll/multiplePayrollIndice');
const ReportManager = require('../../../server/lib/ReportManager');

// Helpers (imported once, ESLint compliant)
const {
  getEmployeeRubricMatrix,
  getEmployeeRubricMatrixUpload,
} = reportController;

describe('test/server-unit/payroll-test-unit/multiplePayrollIndice/report', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      query   : { year : 2024 },
      session : { user : { id : 1 } },
    };

    res = {
      set  : sinon.stub().returnsThis(),
      send : sinon.stub(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  // ------------------------------------------------------------------
  // DOCUMENT (PDF EXPORT)
  // ------------------------------------------------------------------
  it('document() should render the report and send the result', async () => {
    const fakeEmployees = [
      {
        display_name : 'John Doe',
        service_name : 'Finance',
        rubrics : [
          { rubric_abbr : 'BASIC', rubric_value : 1000 },
        ],
      },
    ];

    const fakeRubrics = [
      { abbr : 'BASIC' },
    ];

    const fakeRenderResult = {
      headers : { 'content-type' : 'application/pdf' },
      report  : Buffer.from('PDF_DATA'),
    };

    sinon.stub(multipayIndice, 'lookUp').resolves({
      employees : fakeEmployees,
      rubrics   : fakeRubrics,
    });

    sinon.stub(ReportManager.prototype, 'render')
      .resolves(fakeRenderResult);

    await reportController.document(req, res);

    expect(res.set.calledOnceWith(fakeRenderResult.headers)).to.equal(true);
    expect(res.send.calledOnceWith(fakeRenderResult.report)).to.equal(true);
  });

  it('document() should propagate error if lookup fails', async () => {
    sinon.stub(multipayIndice, 'lookUp')
      .rejects(new Error('Lookup failed'));

    let caught;
    try {
      await reportController.document(req, res);
    } catch (err) {
      caught = err;
    }

    expect(caught).to.be.instanceOf(Error);
    expect(caught.message).to.equal('Lookup failed');
    expect(res.send.notCalled).to.equal(true);
  });

  // ------------------------------------------------------------------
  // HELPER: getEmployeeRubricMatrix
  // ------------------------------------------------------------------
  describe('getEmployeeRubricMatrix()', () => {
    it('should build a matrix of employees by rubrics', () => {
      const employees = [
        {
          display_name : 'Alice',
          service_name : 'HR',
          rubrics : [
            { rubric_abbr : 'A', rubric_value : 10 },
            { rubric_abbr : 'B', rubric_value : 20 },
          ],
        },
      ];

      const rubrics = [
        { abbr : 'A' },
        { abbr : 'B' },
      ];

      const rows = getEmployeeRubricMatrix(employees, rubrics);

      expect(rows).to.be.an('array');
      expect(rows).to.have.lengthOf(1);

      expect(rows[0]).to.include({
        display_name : 'Alice',
        service      : 'HR',
        A            : 10,
        B            : 20,
      });
    });
  });

  // ------------------------------------------------------------------
  // HELPER: getEmployeeRubricMatrixUpload
  // ------------------------------------------------------------------
  describe('getEmployeeRubricMatrixUpload()', () => {
    it('should generate upload matrix with default values', () => {
      const employees = [
        {
          uuid : 'EMP1',
          employee_reference : 'EMP-001',
          display_name : 'John Doe',
          service_name : 'IT',
          rubrics : [],
        },
      ];

      const rubrics = [
        { id : 1, abbr : 'IDX', indice_to_grap : true },
        { id : 2, abbr : 'IGNORED', indice_to_grap : false },
      ];

      const rows = getEmployeeRubricMatrixUpload(
        JSON.parse(JSON.stringify(employees)),
        rubrics,
      );

      expect(rows).to.have.lengthOf(1);
      expect(rows[0]).to.include({
        employee_reference : 'EMP-001',
        display_name       : 'John Doe',
        service            : 'IT',
        IDX                : 0,
      });
    });

    it('should keep existing rubric values when present', () => {
      const employees = [
        {
          uuid : 'EMP2',
          employee_reference : 'EMP-002',
          display_name : 'Jane Doe',
          service_name : 'Operations',
          rubrics : [
            { rubric_id : 1, rubric_value : 75 },
          ],
        },
      ];

      const rubrics = [
        { id : 1, abbr : 'IDX', indice_to_grap : true },
      ];

      const rows = getEmployeeRubricMatrixUpload(
        JSON.parse(JSON.stringify(employees)),
        rubrics,
      );

      expect(rows[0].IDX).to.equal(75);
    });
  });
});
