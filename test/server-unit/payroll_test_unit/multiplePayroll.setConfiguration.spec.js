const { expect } = require('chai');
const sinon = require('sinon');
const moment = require('moment');

const db = require('../../../server/lib/db');
const Exchange = require('../../../server/controllers/finance/exchange');
const { config } = require('../../../server/controllers/payroll/multiplePayroll/setConfiguration');
const { calculateIPRTaxRate } = require('../../../server/controllers/payroll/multiplePayroll/calculation');

describe('test/server-unit/payroll-test-unit/Multiple Payroll Config Controller', () => {
  let req;
  let res;
  let next;
  let transactionStub;

  beforeEach(() => {
    // Mock request
    req = {
      body : {
        data : {
          employee : {
            uuid : 'emp-uuid',
            code : 'EMP001',
            basic_salary : 1000,
            individual_salary : null,
            nb_enfant : 2,
            hiring_date : '2020-01-01',
          },
          iprScales : [
            {
              currency_id : 1,
              min : 0,
              max : 5000,
              rate : 10,
            }],
          periodDateTo : '2025-12-31',
          daysPeriod : {
            working_day : 20,
          },
          working_day : 20,
          currency_id : 1,
          offDays : [
            {
              id : 1,
              percent_pay : 50,
              label : 'Offday',
            }],
          holidays : [
            {
              id : 1,
              numberOfDays : 2,
              percentage : 100,
              label : 'Holiday',
            }],
          value : { BASE : 100 },
        },
      },
      params : { id : 1 },
      session : { enterprise : { id : 1, currency_id : 1 } },
    };

    // Mock response
    res = { sendStatus : sinon.stub() };

    // Mock next
    next = sinon.stub();

    // Stub transaction
    transactionStub = { addQuery : sinon.stub().returnsThis(), execute : sinon.stub().resolves() };
    sinon.stub(db, 'transaction').returns(transactionStub);

    // Stub UUID & bid
    sinon.stub(db, 'uuid').returns('payment-uuid');
    sinon.stub(db, 'bid').callsFake(x => x);

    // Stub Exchange
    sinon.stub(Exchange, 'getExchangeRate').resolves({ rate : 1 });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should calculate daily salary correctly', async () => {
    await config(req, res, next);
    const dailySalary = req.body.data.employee.basic_salary / req.body.data.daysPeriod.working_day;
    expect(dailySalary).to.equal(50); // 1000 / 20 = 50
  });

  it('should calculate seniority in years correctly', async () => {
    await config(req, res, next);
    const yearsOfSeniority = moment(req.body.data.periodDateTo)
      .diff(moment(req.body.data.employee.hiring_date), 'years');
    expect(yearsOfSeniority).to.equal(5);
  });

  it('should calculate basic salary including offdays and holidays', async () => {
    await config(req, res, next);
    const dailySalary = req.body.data.employee.basic_salary / req.body.data.daysPeriod.working_day;
    const workingDayCost = dailySalary * req.body.data.working_day;
    const offDaysCost = (dailySalary * req.body.data.offDays[0].percent_pay) / 100;
    const holidaysCost = (
      dailySalary * req.body.data.holidays[0].percentage * req.body.data.holidays[0].numberOfDays) / 100;
    const basicSalary = workingDayCost + offDaysCost + holidaysCost;
    expect(basicSalary).to.equal(1125); // 1000 + 25 + 100
  });

  it('should classify rubrics correctly', async () => {
    const rubricStub = [
      {
        id : 1,
        is_social_care : 1,
        is_tax : 0,
        is_discount : 0,
        is_membership_fee : 0,
        value : 100,
        is_percent : 0,
        is_seniority_bonus : 0,
        is_family_allowances : 0,
        abbr : 'INSSP',
        rubric_payroll_id : 1,
      },
      {
        id : 2,
        is_social_care : 0,
        is_tax : 1,
        is_discount : 0,
        is_membership_fee : 0,
        value : 10,
        is_percent : 1,
        is_seniority_bonus : 0,
        is_family_allowances : 0,
        abbr : 'IPR',
        rubric_payroll_id : 2,
      },
    ];
    sinon.stub(db, 'exec').resolves(rubricStub);

    await config(req, res, next);

    expect(rubricStub[0].is_social_care).to.equal(1);
    expect(rubricStub[1].is_tax).to.equal(1);
  });

  it('should calculate IPR value correctly', async () => {
    const rubricStub = [
      {
        id : 2,
        is_tax : 1,
        is_discount : 0,
        is_membership_fee : 0,
        is_employee : 1,
        is_ipr : 1,
        value : 0,
        is_percent : 1,
        is_seniority_bonus : 0,
        is_family_allowances : 0,
        abbr : 'IPR',
        rubric_payroll_id : 2,
      },
    ];
    sinon.stub(db, 'exec').resolves(rubricStub);

    sinon.stub(calculateIPRTaxRate, 'bind').returns(() => 100);

    await config(req, res, next);

    expect(rubricStub[0].is_ipr).to.equal(1);
  });

  it('should call next with error if exception occurs', async () => {
    Exchange.getExchangeRate.restore();
    sinon.stub(Exchange, 'getExchangeRate').throws(new Error('Exchange error'));
    await config(req, res, next);
    expect(next.calledOnce).to.equal(true);
  });
});
