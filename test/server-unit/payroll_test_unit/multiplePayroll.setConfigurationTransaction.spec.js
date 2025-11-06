const { expect } = require('chai');
const sinon = require('sinon');

const db = require('../../../server/lib/db');
const Exchange = require('../../../server/controllers/finance/exchange');
const util = require('../../../server/lib/util');
const calc = require('../../../server/controllers/payroll/multiplePayroll/calculation');
const { config } = require('../../../server/controllers/payroll/multiplePayroll/setConfiguration');

describe('test/server-unit/payroll-test-unit/Multiple Payroll Config Controller - Transaction Test with Logs', () => {
  let req;
  let res;
  let next;
  let transactionStub;

  beforeEach(() => {
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
              id : 1,
              rate : 0,
              tranche_annuelle_debut : 0,
              tranche_annuelle_fin : 524160,
              tranche_mensuelle_debut : 0,
              tranche_mensuelle_fin : 43680,
              ecart_annuel : 524160,
              ecart_mensuel : 43680,
              impot_annuel : 0,
              impot_mensuel : 0,
              cumul_annuel : 0,
              cumul_mensuel : 0,
              taxe_ipr_id : 1,
            },
            {
              id : 2,
              rate : 15,
              tranche_annuelle_debut : 524160,
              tranche_annuelle_fin : 1428000,
              tranche_mensuelle_debut : 43680,
              tranche_mensuelle_fin : 119000,
              ecart_annuel : 903840,
              ecart_mensuel : 75320,
              impot_annuel : 135576,
              impot_mensuel : 11298,
              cumul_annuel : 135576,
              cumul_mensuel : 11298,
              taxe_ipr_id : 1,
            },
          ],
          periodDateTo : '2025-12-31',
          daysPeriod : { working_day : 20 },
          working_day : 20,
          currency_id : 1,
          offDays : [{ id : 1, percent_pay : 50, label : 'Offday' }],
          holidays : [
            {
              id : 1, numberOfDays : 2, percentage : 100, label : 'Holiday',
            }],
          value : { BASIC : 100 },
        },
      },
      params : { id : 1 },
      session : { enterprise : { id : 1, currency_id : 1 } },
    };

    res = { sendStatus : sinon.stub() };
    next = sinon.stub();

    transactionStub = {
      addQuery : sinon.stub().callsFake(() => {
        return transactionStub;
      }),
      execute : sinon.stub().callsFake(async () => {
      }),
    };

    sinon.stub(db, 'transaction').returns(transactionStub);
    sinon.stub(db, 'uuid').returns('payment-uuid');
    sinon.stub(db, 'bid').callsFake(x => x);

    sinon.stub(db, 'exec').resolves([
      {
        id : 1,
        config_rubric_id : 1,
        rubric_payroll_id : 1,
        abbr : 'BASIC',
        value : 100,
        is_percent : 0,
        is_seniority_bonus : 0,
        is_family_allowances : 0,
        is_social_care : 0,
        is_tax : 0,
        is_discount : 0,
        is_membership_fee : 0,
        debtor_account_id : 1,
        expense_account_id : 1,
      },
      {
        id : 2,
        config_rubric_id : 1,
        rubric_payroll_id : 2,
        abbr : 'IPR',
        value : 10,
        is_percent : 1,
        is_seniority_bonus : 0,
        is_family_allowances : 0,
        is_social_care : 0,
        is_tax : 1,
        is_discount : 0,
        is_membership_fee : 0,
        debtor_account_id : 1,
        expense_account_id : 1,
        is_employee : 1,
        is_ipr : 1,
      },
    ]);

    sinon.stub(Exchange, 'getExchangeRate').resolves({ rate : 1 });
    sinon.stub(util, 'roundDecimal').callsFake(v => Math.round((v || 0) * 100) / 100);
    sinon.stub(calc, 'calculateIPRTaxRate').returns(50);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should send 201 status after successful transaction', async () => {
    await config(req, res, next);

    expect(transactionStub.addQuery.callCount).to.be.at.least(4);
    expect(transactionStub.execute.calledOnce).to.equal(true);
    expect(res.sendStatus.calledOnceWith(201)).to.equal(true);
    expect(next.called).to.equal(false);
  });
});
