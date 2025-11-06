const { expect } = require('chai');
const sinon = require('sinon');

const build = require('../../../server/controllers/payroll/reports/payslipGenerator');
const ReportManager = require('../../../server/lib/ReportManager');
const configurationData = require('../../../server/controllers/payroll/multiplePayroll/find');
const Exchange = require('../../../server/controllers/finance/exchange');

describe('test/server-unit/payroll-test-unit/payroll/reports/payslipGenerator', () => {
  let req;
  let res;

  // Dummy employee data
  const employeesFake = [
    {
      employee_uuid : '75E69409562FA2A845A13D7938B02500',
      reference : 2,
      code : 'WWEFCB',
      hiring_date : new Date('2016-01-01'),
      nb_enfant : 0,
      individual_salary : 0,
      account_id : 179,
      creditor_uuid : '18DCADA5F1494EEA826719C346C2744F',
      function_name : 'Infirmier',
      display_name : 'EMPLOYEE TEST 1',
      sex : 'F',
      payment_uuid : '13174940CB8441019C25FB5A5C7A4EEE',
      payroll_configuration_id : '4',
      currency_id : '2',
      base_taxable : 50,
      basic_salary : 50,
      gross_salary : 65,
      net_salary : 63.06,
      working_day : 28,
      total_day : 28,
      daily_salary : 1.79,
    },
    {
      employee_uuid : '75E0969465F245A1A8A28B025003D793',
      reference : 1,
      code : 'E1',
      hiring_date : new Date('2016-02-01'),
      nb_enfant : 3,
      individual_salary : 500,
      account_id : 179,
      creditor_uuid : '42D3756A77704BB8A8997953CD859892',
      function_name : 'Infirmier',
      display_name : 'TEST 2 PATIENT',
      sex : 'M',
      payment_uuid : '86057A3F53594F449A07DF48CF1879CC',
      payroll_configuration_id : '4',
      currency_id : '2',
      base_taxable : 500,
      basic_salary : 500,
      gross_salary : 650,
      net_salary : 547.16,
      working_day : 28,
      total_day : 28,
      daily_salary : 17.86,
    },
  ];

  beforeEach(() => {
    // Dummy res object
    res = {
      set : sinon.stub().returnsThis(),
      send : sinon.stub(),
    };

    // Global stubs for all suites
    sinon.stub(ReportManager.prototype, 'render').resolves({
      headers : { 'Content-Type' : 'fake/type' },
      report : 'fake-report',
    });

    sinon.stub(configurationData, 'find').resolves(employeesFake);

    sinon.stub(Exchange, 'getExchangeRate').resolves({ rate : 1 });
    sinon.stub(Exchange, 'getCurrentExchangeRateByCurrency').resolves([
      { currency_id : 2, rate : 1 },
    ]);
  });

  afterEach(() => {
    // Complete cleaning
    sinon.restore();
  });

  describe('SocialCharge report', () => {
    beforeEach(() => {
      req = {
        query : {
          socialCharge : 'true',
          currency_id : '2',
          displayValues : '',
          employees : [
            '75E69409562FA2A845A13D7938B02500',
            '75E0969465F245A1A8A28B025003D793',
          ],
          lang : 'fr',
          payroll_configuration_id : '4',
          renderer : 'xls',
        },
        session : {
          user : { id : 1 },
          enterprise : { id : 1, settings : { enable_index_payment_system : 1 }, currency_id : 2 },
        },
      };
    });

    it('should select socialCharge template and set correct options', async () => {
      await build(req, res);
      const reportInstance = ReportManager.prototype.render.firstCall.thisValue;

      expect(reportInstance.template).to.include('payrollReportSocialCharge');
      expect(reportInstance.options.orientation).to.equal('portrait');
      expect(reportInstance.options.filename).to.equal('FORM.LABELS.REPORT_SOCIAL_CHARGES');
      expect(res.set.calledOnce).to.equal(true);
      expect(res.send.calledOnce).to.equal(true);
      expect(res.send.firstCall.args[0]).to.equal('fake-report');
    });
  });

  describe('General payroll report', () => {
    beforeEach(() => {
      req = {
        query : {
          currency : '2',
          employees : [
            '75E69409562FA2A845A13D7938B02500',
            '75E0969465F245A1A8A28B025003D793',
          ],
          idPeriod : '4',
          lang : 'fr',
          renderer : 'pdf',
        },
        session : {
          user : { id : 1 },
          enterprise : { id : 1, settings : { enable_index_payment_system : 1 }, currency_id : 2 },
        },
      };
    });

    it('should select general payroll report template and set correct options', async () => {
      await build(req, res);
      const reportInstance = ReportManager.prototype.render.firstCall.thisValue;

      expect(reportInstance.template).to.include('payrollReportGenerator');
      expect(reportInstance.options.filename).to.equal('FORM.LABELS.REPORT');
      expect(reportInstance.options.orientation).to.equal('landscape');
      expect(res.set.calledOnce).to.equal(true);
      expect(res.send.calledOnce).to.equal(true);
      expect(res.send.firstCall.args[0]).to.equal('fake-report');
    });
  });

  describe('Payslip (bulletin de paie)', () => {
    beforeEach(() => {
      req = {
        query : {
          currency : '2',
          employees : [
            '75E69409562FA2A845A13D7938B02500',
            '75E0969465F245A1A8A28B025003D793',
          ],
          idPeriod : '4',
          lang : 'fr',
          payslip : 'true',
          renderer : 'pdf',
        },
        session : {
          user : { id : 1 },
          enterprise : { id : 1, settings : { enable_index_payment_system : 1 }, currency_id : 2 },
        },
      };
    });

    it('should select payslip template and set default options', async () => {
      await build(req, res);
      const reportInstance = ReportManager.prototype.render.firstCall.thisValue;

      expect(reportInstance.template).to.include('payslipGenerator');
      expect(reportInstance.options.filename).to.equal('FORM.LABELS.PAYSLIP');
      expect(reportInstance.options.orientation).to.equal('landscape');
      expect(res.set.calledOnce).to.equal(true);
      expect(res.send.calledOnce).to.equal(true);
      expect(res.send.firstCall.args[0]).to.equal('fake-report');
    });
  });
});
