/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('../helpers');

/*
 * The /multiplePayroll  API
 *
 * Scenario Descriptions for Payroll Processes
 * Scenario Analysis for Payroll Calculation in the Classic System
 * For the classic payroll system, we will use the payroll period PAYROLL KEY DELIVERABLE 4,
 * which spans from January 1st to January 31st, 2025. In this analysis, we will review the various
 * configurations that make up this payroll period, in order to understand
 * the parameters used for calculating employee salaries.
 */
describe('test/integration/ Scenario Analysis for Payroll Calculation in the Classic System ', () => {

  const params = {
    periodPaie : 20,
    dateFrom  : '2025-01-01',
    dateTo  : '2025-01-31',
    employeeUuid : '75e09694-65f2-45a1-a8a2-8b025003d793',
  };

  // For Employees Ethan James Caldwell and Harper Elise Whitmore
  const employees = [{
    employee_uuid : 'B8C3674B2F264B598C16FBA76F5116D1',
    code : 'EMP-STAFF-0202501',
    hiring_date : '1990-01-01',
    nb_enfant : 3,
    individual_salary : 220,
    account_id : 179,
    creditor_uuid : '393E380FA08D42F0B513C56D9BDA7168',
    payroll_configuration_id : params.periodPaie,
    currency_id : '2',
    base_taxable : 0,
    basic_salary : 0,
    gross_salary : 0,
    grade_salary : 250,
    net_salary : 0,
    working_day : 0,
    total_day : 0,
    daily_salary : 0,
    amount_paid : 0,
    status_id : 1,
    status : 'PAYROLL_STATUS.WAITING_FOR_CONFIGURATION',
    balance : 0,
  }, {
    employee_uuid : '51D6A9297B464327B6EB8155BDBDC9E0',
    code : 'EMP-STAFF-0202503',
    hiring_date : '2021-06-17',
    nb_enfant : 0,
    individual_salary : 30,
    account_id : 179,
    creditor_uuid : 'ECD4EB47FCB34D8F944E761612CB7BBF',
    uuid : null,
    payroll_configuration_id : params.periodPaie,
    currency_id : '2',
    payment_date : null,
    base_taxable : 0,
    basic_salary : 0,
    gross_salary : 0,
    net_salary : 0,
    working_day : 0,
    total_day : 0,
    daily_salary : 0,
    amount_paid : 0,
    status_id : 1,
    status : 'PAYROLL_STATUS.WAITING_FOR_CONFIGURATION',
    balance : 0,
  }];

  const dataMultiConfiguration = {
    data : {
      employees,
      currencyId : 2,
    },
  };

  // Amelia Rose Thornton
  const dataConfiguration = {
    data : {
      currency_id : 2,
      off_days : 0,
      nb_holidays : 0,
      working_day : 23,
      value : {
        TPR : 70,
        'AL-FAM' : 30,
        'AC-SAL' : 100,
        f_scol : 50,
        v_cher : 0,
        PRI : 25,
      },
      employee :
      {
        uuid : '0D68B9D64D1F45EDA43302D619F7CE98',
        code : 'Amelia Rose Thornton',
        hiring_date : '1983-01-01',
        nb_enfant : 0,
        grade_uuid  : 'BB8FA450A3AF4CA29CBD561BA5DFDA8F',
        basic_salary : 225,
        individual_salary : 0,
        creditor_uuid : '10F10BC632F9439C8C6EF5591E91324D',
        account_id : 366,
      },
      offDays : [],
      holidays : [],
      daysPeriod : { working_day : 23 },
      iprScales :
     [{
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
     }],
    },
  };

  const paramsConfig = {
    currency : '2',
    employees : '0D68B9D64D1F45EDA43302D619F7CE98',
    idPeriod : params.periodPaie,
    lang : 'fr',
    payslip : 'true',
    renderer : 'json',
  };

  const paramsMultiConfig = {
    currency : 2,
    employees : [
      'B8C3674B2F264B598C16FBA76F5116D1',
      '51D6A9297B464327B6EB8155BDBDC9E0',
    ],
    idPeriod : params.periodPaie,
    lang : 'fr',
    payslip : 'true',
    renderer : 'json',
  };

  // Amelia Rose Thornton
  it('POST /multiple_payroll/:id/ Payroll Management: Continuity of Work For Employees Amelia Rose Thornton', () => {
    return agent.post('/multiple_payroll/'.concat(params.periodPaie, '/configuration'))
      .send(dataConfiguration)
      .then((res) => {
        expect(res).to.have.status(201);

        return agent.get('/reports/payroll/payslip')
          .query(paramsConfig);
      })
      .then((res) => {
        // School Fees
        const schoolFees = res.body.rubrics.find(
          item => item.abbr === 'f_scol',
        );
        expect(schoolFees.total).to.equal(50);

        // The seniority bonus is calculated automatically by the system, using the formula:
        // Base Salary × Seniority Rate × Years of Service
        // $225 × 0.035 × 42 = $330.75
        const seniorityBonus = res.body.rubrics.find(
          item => item.abbr === 'PR-ANC',
        );
        expect(seniorityBonus.total).to.equal(330.75);

        // Other Bonuses
        const otherBonuses = res.body.rubrics.find(
          item => item.abbr === 'PRI',
        );

        expect(otherBonuses.total).to.equal(25);

        // ### Breakdown of Taxable Earnings
        // | Description               | Amount   |
        // |---------------------------|----------|
        // | School Fees               | $50.00   |
        // | Cost of Living Allowance  | $0.00    |
        // | Seniority Bonus           | $330.75  |
        // | Other Bonuses             | $25.00   |
        // |---------------------------|----------|
        // | Taxable Net Income        | $405.75  |
        expect(res.body.dataEmployees[0].somRubTaxable_equiv).to.equal(405.75);

        // Family Allowance
        expect(res.body.rubrics.find(item => item.abbr === 'AL-FAM').total).to.equal(30);

        // INSS QPO (3.5%): `(225 + 405.75) × 0.035 = $22.08
        expect(res.body.rubrics.find(item => item.abbr === 'INSSQ').total).to.equal(22.08);

        // Housing Benefit (30% of base)
        // 225 × 0.3 = $67.5
        expect(res.body.rubrics.find(item => item.abbr === 'LOGEM').total).to.equal(67.50);

        // Breakdown of Non-Taxable Earnings
        // | Description                           | Amount   |
        // |---------------------------------------|----------|
        // | Family Allowance                      | $30.00   |
        // | In-Kind Benefit – Housing (30%)       | $67.50   |
        // | Transport Allowance                   | $70.00   |
        // | Non-Taxable Net Income                | $167.50  |
        expect(res.body.dataEmployees[0].somRubNonTaxable_equiv).to.equal(167.5);

        // ### Gross Salary Calculation
        // | Component                | Amount   |
        // |--------------------------|----------|
        // | Base Salary              | $225.00  |
        // | Taxable Net Income       | $405.75  |
        // | Non-Taxable Net Income   | $167.50  |
        // | Gross Salary             | $798.25  |
        expect(res.body.dataEmployees[0].gross_salary_equiv).to.equal(798.25);

        // #### IPR Tax Calculation Based on Progressive Brackets (Payroll System Logic)
        /**
         * 1. Identify the taxable portion within the current bracket
         * Before applying the 25% tax rate, we must isolate the income portion within the selected bracket:
         * 6,792,799.05 FC - 4,620,000 FC = 2,172,799.05 FC
         *
         * 2. Apply the marginal tax rate to the excess amount
         * The taxable amount within this bracket is then taxed at the applicable rate:
         *  2,172,799.05 FC / 25% = 543,199.76 FC
         *
         * 3. Add the cumulative tax from the previous bracket
         * Payroll systems generally store the **cumulative tax amount from all lower brackets**,
         * which ensures accuracy and compliance with progressive taxation:
         * 543,199.76 FC + 821,976 FC = 1,365,175.76 FC
         *
         * 4. Derive the monthly IPR liability
         * Since payroll systems process employee taxes on a monthly basis, the annual tax must be converted to monthly:
         * 1,365,175.76 FC / 12 = 113,764.65 {FC/month}
         *
         * 5. Convert to USD (if payment is made in dollars)
         * If the salary and tax payments are made in USD, the monthly tax
         * is converted using the current exchange rate (e.g. 1 USD = 930 FC):
         * 113,764.65FC / 930 = $122.33
         */
        expect(res.body.rubrics.find(item => item.abbr === 'IPR').total).to.equal(122.33);

        // ### Net Salary Calculation
        // | Description                                       | Amount (USD) |
        // |---------------------------------------------------|---------------|
        // | Salary Advance**                                  | $100.00       |
        // | INSS QPO Contribution (Social Security - 3.5%)    | $22.08        |
        // | Professional Income Tax (IPR)                     | $122.33       |
        // | Total Deductions                                  | $244.41       |

        expect(res.body.dataEmployees[0].somChargeEmployee_equiv).to.equal(244.41);

        // | Description                              | Amount (USD)      |
        // |------------------------------------------|-------------------|
        // | Gross Salary                             | $798.25           |
        // | Total Deductions                         | $244.41           |
        // | Net Salary (Gross Salary - Deductions)   | $553.84           |
        // The Net Salary is obtained by subtracting the total deductions from the Gross Salary, i.e.,
        // $798.25 - $244.41 = $553.84.
        expect(res.body.dataEmployees[0].net_salary_equiv).to.equal(553.84);

      })
      .catch(helpers.handler);
  });

  // For Employees Ethan James Caldwell and Harper Elise Whitmore
  it('POST /multiple_payroll/:id/multiConfiguration should Set Configuration of Paiement for Multiple Patient', () => {
    return agent.post('/multiple_payroll/'.concat(params.periodPaie, '/multiConfiguration'))
      .send(dataMultiConfiguration)
      .then((res) => {
        expect(res).to.have.status(201);

        return agent.get('/reports/payroll/payslip')
          .query(paramsMultiConfig);
      })
      .then((res) => {
        /**
         * Ethan James Caldwell
         */

        // Seniority Bonus Calculation
        // 220 × 35 × 0.035 = $269.50
        expect(res.body.dataEmployees[0].rubricTaxable.find(
          item => item.abbr === 'PR-ANC').result_equiv).to.equal(269.5);

        // Housing Benefit (30% of base)
        // 220 × 0.3 = $66.00
        expect(res.body.dataEmployees[0].rubricNonTaxable.find(
          item => item.abbr === 'LOGEM').result_equiv).to.equal(66);

        // School Fees: $0.00
        // Cost of Living Allowance: $0.00
        // Seniority Bonus: $269.50
        // Other Bonuses: $0.00
        // Total Taxable Benefits: $269.50
        expect(res.body.dataEmployees[0].somRubTaxable_equiv).to.equal(269.5);

        // Non-Taxable Benefits
        // Family Allowances: $120.00
        // Housing (in-kind, 30%): $66.00
        // Transport: $50.00
        // Total Non-Taxable Benefits: $236.00
        expect(res.body.dataEmployees[0].somRubNonTaxable_equiv).to.equal(236);

        // Summary
        // Base Salary: $220.00
        // Net Taxable: $269.50
        // Net Non-Taxable: $236.00
        // Gross Salary: $725.50
        expect(res.body.dataEmployees[0].gross_salary_equiv).to.equal(725.5);

        // INSS QPO (3.5%): `(220 + 269.50) × 0.035 = $17.13
        expect(res.body.dataEmployees[0].rubricDiscount.find(
          item => item.abbr === 'INSSQ').result_equiv).to.equal(17.13);

        // #### IPR Tax Band:
        // Falls within: `4,620,000 – 7,260,000 CDF
        // #### Calculation:
        // Difference: `5,271,621.30 - 4,620,000 = 651,621.30
        // Tax: `651,621.30 × 0.25 = 162,905.33
        // Add lower bracket cumulative: `821,976 + 162,905.33 = 984,881.33
        // Monthly IPR: `984,881.33 / 12 = 82,073.44 CDF`
        // Converted to USD: `82,073.44 / 930 = $88.25`
        // ### Dependent Reduction
        // 3 children → `88.25 × 0.02 × 3 = $5.30
        // Final IPR = `88.25 - 5.30 = $82.96
        expect(res.body.dataEmployees[0].rubricDiscount.find(
          item => item.abbr === 'IPR').result_equiv).to.equal(82.96);

        // Total Deductions
        // Salary Advance                        | $0.00   |
        // INSS QPO (3.5%)                       | $17.13  |
        // IPR                                   | $82.96  |
        // Total Deductions                    | $100.09 |
        const totalDeduction = Math.round(res.body.dataEmployees[0].somChargeEmployee_equiv * 100) / 100;
        expect(totalDeduction).to.equal(100.09);

        // Net Salary Calculation
        // Gross Salary: `$725.50`
        // Deductions: `$100.09`
        // Net Salary: `$625.41`
        expect(res.body.dataEmployees[0].net_salary_equiv).to.equal(625.41);

        /**
         * Harper Elise Whitmore
         */

        // Employment Details
        // Date of Hire: 2021-06-17
        // Years of Service: 3 years
        // Base Salary (Custom) $30 (not linked to grade)
        // Dependents: 1
        //  Leave Information
        // - Leave Period: January 15 to January 28
        // - Leave Type: Leave of absence
        // - Leave Pay Rate: 80%
        // - Working Days in the Month: 23
        // - Paid Leave Days: 10 (Calculated based on system configuration for weekends)
        // - Days Worked: 13
        // ### Payroll Calculation
        // #### Daily Rate Calculation
        // - Daily Rate: $30 ÷ 23 = $1.3043
        // #### Regular Pay
        // - 13 Days × $1.3043 = $16.96
        // #### Leave Pay (80%)
        // - 10 Days × $1.3043 × 0.8 = $10.43
        // #### Recalculated Base Salary
        // - $16.96 + $10.43 = $27.39
        expect(res.body.dataEmployees[1].basic_salary_equiv).to.equal(27.39);

        // ### Allowances & Benefits
        // #### Seniority Bonus
        // - $27.39 × 3 years × 0.035 = $2.88
        expect(res.body.dataEmployees[1].rubricTaxable.find(
          item => item.abbr === 'PR-ANC').result_equiv).to.equal(2.88);

        // #### Housing Allowance (30%)
        // - $27.39 × 0.3 = $8.22
        expect(res.body.dataEmployees[1].rubricNonTaxable.find(
          item => item.abbr === 'LOGEM').result_equiv).to.equal(8.22);

        // #### High Cost of Living Indemnity
        // - $5.00
        expect(res.body.dataEmployees[1].rubricTaxable.find(
          item => item.abbr === 'v_cher').result_equiv).to.equal(5);

        // #### Taxable Benefits
        // | Component                   | Amount |
        // |-----------------------------|--------|
        // | Seniority Bonus             | $2.88  |
        // | High Cost of Living         | $5.00  |
        // | Total Taxable               | $7.88  |
        expect(res.body.dataEmployees[1].somRubTaxable_equiv).to.equal(7.88);

        // #### Non-Taxable Benefits
        // | Component                 | Amount  |
        // |---------------------------|---------|
        // | Housing (30%)             | $8.22   |
        // | Transport                 | $40.00  |
        // | Total Non-Taxable         | $48.22  |
        expect(res.body.dataEmployees[1].somRubNonTaxable_equiv).to.equal(48.22);

        // ### Salary Summary
        // | Category               | Amount     |
        // |------------------------|------------|
        // | Base Salary            | $27.39     |
        // | Net Taxable            | $7.88      |
        // | Net Non-Taxable        | $48.22     |
        // | Gross Salary           | $83.49     |
        expect(res.body.dataEmployees[1].gross_salary_equiv).to.equal(83.49);

        // #### INSS (Social Security - Employee Share 3.5%)
        // - Base: $27.39 + $7.88 = $35.27
        // - INSS QPO 3.5% = $1.23
        expect(res.body.dataEmployees[1].rubricDiscount.find(
          item => item.abbr === 'INSSQ').result_equiv).to.equal(1.23);

        // #### Tax Base (IPR Calculation)
        // - $35.27 - $1.23 = $34.03
        // - Exchange Rate: 1 USD = 930 CDF
        // IPR Base: $34.03 × 930 = 31,650.72 CDF
        // - Annualized: 31,650.72 × 12 = 379,808.64 CDF
        // #### IPR Tax Bracket Evaluation
        // - Bracket: 0 – 524,160 CDF → 0%
        // - IPR Tax: 379,808.64 × 0% = 0 CDF
        expect(res.body.dataEmployees[1].rubricDiscount.find(
          item => item.abbr === 'IPR').result_equiv).to.equal(0);

        // ### Final Deductions Summary
        // | Deduction                           | Amount |
        // |-------------------------------------|--------|
        // | Salary Advance                      | $0.00  |
        // | INSS QPO (3.5%)                     | $1.23  |
        // | IPR Tax                             | $0.00  |
        // | **Total Deductions**                | $1.23  |
        expect(res.body.dataEmployees[1].somChargeEmployee_equiv).to.equal(1.23);

        // ### Final Take-Home Pay
        // - Net Salary: $83.49 - $1.23 = $82.26
        expect(res.body.dataEmployees[1].net_salary_equiv).to.equal(82.26);

      })
      .catch(helpers.handler);
  });

});
