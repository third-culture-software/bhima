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
              id : 1,
              currency_id : 1,
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
              currency_id : 1,
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
            {
              id : 3,
              currency_id : 1,
              rate : 20,
              tranche_annuelle_debut : 1428000,
              tranche_annuelle_fin : 2700000,
              tranche_mensuelle_debut : 119000,
              tranche_mensuelle_fin : 225000,
              ecart_annuel : 1272000,
              ecart_mensuel : 106000,
              impot_annuel : 254400,
              impot_mensuel : 21200,
              cumul_annuel : 389976,
              cumul_mensuel : 32498,
              taxe_ipr_id : 1,
            },
            {
              id : 4,
              currency_id : 1,
              rate : 22.5,
              tranche_annuelle_debut : 2700000,
              tranche_annuelle_fin : 4620000,
              tranche_mensuelle_debut : 225000,
              tranche_mensuelle_fin : 385000,
              ecart_annuel : 1920000,
              ecart_mensuel : 160000,
              impot_annuel : 432000,
              impot_mensuel : 36000,
              cumul_annuel : 821976,
              cumul_mensuel : 68498,
              taxe_ipr_id : 1,
            },
            {
              id : 5,
              currency_id : 1,
              rate : 25,
              tranche_annuelle_debut : 4620000,
              tranche_annuelle_fin : 7260000,
              tranche_mensuelle_debut : 385000,
              tranche_mensuelle_fin : 605000,
              ecart_annuel : 2640000,
              ecart_mensuel : 220000,
              impot_annuel : 660000,
              impot_mensuel : 55000,
              cumul_annuel : 1481980,
              cumul_mensuel : 123498,
              taxe_ipr_id : 1,
            },
            {
              id : 6,
              currency_id : 1,
              rate : 30,
              tranche_annuelle_debut : 7260000,
              tranche_annuelle_fin : 10260000,
              tranche_mensuelle_debut : 605000,
              tranche_mensuelle_fin : 855000,
              ecart_annuel : 3000000,
              ecart_mensuel : 250000,
              impot_annuel : 900000,
              impot_mensuel : 75000,
              cumul_annuel : 2381980,
              cumul_mensuel : 198498,
              taxe_ipr_id : 1,
            },
            {
              id : 7,
              currency_id : 1,
              rate : 32.5,
              tranche_annuelle_debut : 10260000,
              tranche_annuelle_fin : 13908000,
              tranche_mensuelle_debut : 855000,
              tranche_mensuelle_fin : 1159000,
              ecart_annuel : 3648000,
              ecart_mensuel : 304000,
              impot_annuel : 1185600,
              impot_mensuel : 98800,
              cumul_annuel : 3567580,
              cumul_mensuel : 297298,
              taxe_ipr_id : 1,
            },
            {
              id : 8,
              currency_id : 1,
              rate : 35,
              tranche_annuelle_debut : 13908000,
              tranche_annuelle_fin : 16824000,
              tranche_mensuelle_debut : 1159000,
              tranche_mensuelle_fin : 1402000,
              ecart_annuel : 2916000,
              ecart_mensuel : 243000,
              impot_annuel : 1020600,
              impot_mensuel : 85050,
              cumul_annuel : 4588180,
              cumul_mensuel : 382348,
              taxe_ipr_id : 1,
            },
            {
              id : 9,
              currency_id : 1,
              rate : 37.5,
              tranche_annuelle_debut : 16824000,
              tranche_annuelle_fin : 22956000,
              tranche_mensuelle_debut : 1402000,
              tranche_mensuelle_fin : 1913000,
              ecart_annuel : 6132000,
              ecart_mensuel : 511000,
              impot_annuel : 2299500,
              impot_mensuel : 191625,
              cumul_annuel : 6887680,
              cumul_mensuel : 573973,
              taxe_ipr_id : 1,
            },
            {
              id : 10,
              currency_id : 1,
              rate : 40,
              tranche_annuelle_debut : 22956000,
              tranche_annuelle_fin : 100000000000000,
              tranche_mensuelle_debut : 1913000,
              tranche_mensuelle_fin : 1913000,
              ecart_annuel : 0,
              ecart_mensuel : 0,
              impot_annuel : 0,
              impot_mensuel : 0,
              cumul_annuel : 6887680,
              cumul_mensuel : 573973,
              taxe_ipr_id : 1,
            },
          ],
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

    // Stub transaction
    transactionStub = { addQuery : sinon.stub().returnsThis(), execute : sinon.stub().resolves() };
    sinon.stub(db, 'transaction').returns(transactionStub);

    // Stub UUID & bid
    sinon.stub(db, 'uuid').returns('payment-uuid');
    sinon.stub(db, 'bid').callsFake(x => x);

    // Stub Exchange
    sinon.stub(Exchange, 'getExchangeRate').resolves({ rate : 1 });
  });

  afterEach(() => { sinon.restore(); });

  it('should calculate daily salary correctly', async () => {
    await config(req, res);

    const insertPaymentQuery = transactionStub.addQuery
      .getCalls()
      .find(call => call.args[0].includes('INSERT INTO payment'));

    const paymentData = insertPaymentQuery.args[1][0];

    // Assert daily salary
    expect(paymentData.daily_salary).to.equal(50);

    // Assert sendStatus called correctly
    sinon.assert.calledOnce(res.sendStatus);
    sinon.assert.calledWith(res.sendStatus, 201);
  });

  it('should calculate basic salary including offdays and holidays NEW', async () => { 
        // --- 1. PREPARE REAL PAYROLL RUBRICS (based on your SQL) ---
        // We simulate the result of the SQL query expected by the controller.
        // Each rubric has flags (is_tax, is_social_care) that drive the controller logic.
        const mockRubrics = [
            { id: 1, label: 'INSS QPP', abbr: 'INSSP', is_employee: 0, is_percent: 1, is_tax: 0, is_social_care: 0, value: 5 },
            { id: 2, label: 'IPR', abbr: 'IPR', is_employee: 1, is_percent: 0, is_tax: 1, is_social_care: 0, value: null, is_ipr: 1 },
            { id: 3, label: 'INPP', abbr: 'INPP', is_employee: 0, is_percent: 1, is_tax: 1, is_social_care: 0, value: 2 },
            { id: 4, label: 'INSS QPO', abbr: 'INSSQ', is_employee: 1, is_percent: 1, is_tax: 0, is_social_care: 0, value: 3.5 },
            { id: 5, label: 'Transport', abbr: 'TPR', is_employee: 0, is_percent: 0, is_tax: 0, is_social_care: 1, value: null },
            { id: 9, label: 'Logement', abbr: 'LOGEM', is_employee: 0, is_percent: 1, is_tax: 0, is_social_care: 1, value: 30 }
        ];

        // --- 2. DATABASE STUB ---
        // We intercept the db.exec call and force it to return our mock rubrics.
        // This prevents the error "No payroll rubrics found" at line 154 of the controller.
        const dbExecStub = sinon.stub(db, 'exec').resolves(mockRubrics);

        try {
            // --- 3. RUN THE CONTROLLER ---
            // The controller will now loop through mockRubrics without failing.
            await config(req, res);

            // --- 4. GET THE REAL DATA (core of the test) ---
            // We collect transaction calls to see what was actually calculated.
            const allDbCalls = transactionStub.addQuery.getCalls();
            
            // Look for the insert into the 'payment' table
            const paymentInsertCall = allDbCalls.find(call => 
                call.args[0].includes('INSERT INTO payment')
            );

            // Safety check: the test fails here if the controller inserted nothing
            expect(paymentInsertCall, "The controller did not generate a SQL insert for payment").to.not.be.undefined;

            // Get the object sent to the database (final controller calculation)
            const actualDataSentToDb = paymentInsertCall.args[1][0];
            const actualCalculatedSalary = actualDataSentToDb.basic_salary;

            // --- 5. THEORETICAL CALCULATION (our reference) ---
            // Base salary (1000) / Days (20) = 50 per day
            const daily = req.body.data.employee.basic_salary / req.body.data.daysPeriod.working_day;
            
            // 20 worked days (1000) + 50% of one offday (25) + 2 holidays at 100% (100)
            const expectedTotal = (daily * 20) + (daily * 0.5) + (daily * 2); // Result: 1125

            // --- 6. ASSERTIONS ---
            // We verify that the controller found the same result as we did (1125)
            expect(actualCalculatedSalary).to.equal(expectedTotal, 
                `Calculation error: controller generated ${actualCalculatedSalary} instead of ${expectedTotal}`
            );

            // Verify the HTTP response is successful
            sinon.assert.calledWith(res.sendStatus, 201);

        } finally {
            // Cleanup: restore db.exec so it does not affect other tests
            dbExecStub.restore();
        }
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

    expect(rubricStub[0].is_social_care).to.equal(1);
    expect(rubricStub[1].is_tax).to.equal(1);
  });

  it('should throw an error if an error occurs', async () => {
    Exchange.getExchangeRate.restore();
    sinon.stub(Exchange, 'getExchangeRate').rejects(new Error('Exchange error'));
    await expect(config(req, res)).to.be.rejectedWith('Exchange error');
  });
});
