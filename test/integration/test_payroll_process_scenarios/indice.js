/* global expect, agent */
/* eslint-disable no-unused-expressions */
const fs = require('fs');
const helpers = require('../helpers');

/*
 * The /multiplePayroll  API
 *
 * Scenario Analysis for Payroll Calculation in the Index System
 * The BHIMA system provides a robust and flexible method for calculating employee payrolls,
 * including the allocation (or "ventilation") of local allowances and bonuses. This system is based on a series of
 * index-based constants that allow accurate and individualized payroll computation, especially in environments where
 * grade and experience significantly affect earnings.
 */
describe('test/integration/ Scenario Analysis for Payroll Calculation in the Index System', () => {
  const file = './test/fixtures/payroll-employees-config.csv';
  const missingEmployee = './test/fixtures/payroll-employees-config-missing-employee.csv';
  const surplusEmployee = './test/fixtures/payroll-employees-config-not-found-employee.csv';
  const singleEmployee = './test/fixtures/payroll-employees-single-day-config.csv';

  const filename = 'payroll-employees-config.csv';
  const filenameMissingEmployee = 'payroll-employees-config-missing-employee.csv';
  const filenameSurplusEmployee = 'payroll-employees-config-not-found-employee.csv';
  const filenameSingleEmployee = 'payroll-employees-single-day-config.csv';

  const params = {
    periodPaie : 21,
    dateFrom  : '2025-01-01',
    dateTo  : '2025-01-31',
  };

  const paramsPayEnvelope = {
    payroll_configuration_id : 21,
    pay_envelope : 14000,
    working_days : '23',
    lang : 'fr',
    pension_fund : 0,
  };

  const paramsPayEnvelope1 = {
    payroll_configuration_id : 21,
    pay_envelope : 30000,
    working_days : '23',
    lang : 'fr',
    pension_fund : 0,
  };

  const queryParameters = {
    currency_id : 2,
    payroll_configuration_id : 21,
  };

  /**
   * test the /multiple_payroll_indice/upload/ API for importing a payroll Configuration from a csv file
   */
  it(`POST /multiple_payroll_indice/upload/ upload and import a Payroll Configuration template file`, () => {
    return agent.post(`/multiple_payroll_indice/upload/${params.periodPaie}`)
      .attach('file', fs.createReadStream(file), filename)
      .then(res => {
        expect(res).to.have.status(204);
      })
      .catch(helpers.handler);
  });

  /**
   * test the /multiple_payroll_indice/upload/ API for should detect missing employees in the uploaded file
   */
  it(`POST /multiple_payroll_indice/upload/ should detect missing employees in the uploaded file`, () => {
    return agent.post(`/multiple_payroll_indice/upload/${params.periodPaie}`)
      .attach('file', fs.createReadStream(missingEmployee), filenameMissingEmployee)
      .then(res => {
        expect(res).to.have.status(400);

        expect(res.body.description).to.equal(
          `Warning: The configured list of employees does not match the initially configured list.`);
      })
      .catch(helpers.handler);
  });

  /**
   * test the /multiple_payroll_indice/upload/ API for should warn about employees
   * not found in the initial configuration (with line numbers)
   */
  it(`POST /multiple_payroll_indice/upload/ should detect
     employees not found in the initial configuration (with line numbers)`, () => {
    return agent.post(`/multiple_payroll_indice/upload/${params.periodPaie}`)
      .attach('file', fs.createReadStream(surplusEmployee), filenameSurplusEmployee)
      .then(res => {
        expect(res).to.have.status(400);

        expect(res.body.description).to.equal(
          `Warning: Could not find the employees on lines 12,71,72,73,74,75,76.`);
      })
      .catch(helpers.handler);
  });

  /**
   * test the /multiple_payroll_indice/parameters/ API for Configure Total Payroll Envelope
   */
  it('POST /multiple_payroll/:id/ Payroll Management: Continuity of Work For Employees Amelia Rose Thornton', () => {
    return agent.post('/multiple_payroll_indice/parameters/')
      .send(paramsPayEnvelope)
      .then((res) => {
        expect(res).to.have.status(201);

        return agent.get('/multiple_payroll_indice/')
          .query(queryParameters);
      })
      .then((res) => {
        // Olivier Benjamin Hensley
        // EM.TE.1266
        // Hiring Date : January 1, 2015
        // Seniority**: 10 years (as of January 1, 2025)

        const dataOlivierBenjaminHensley = res.body.employees.find(item => item.employee_reference === 'EM.TE.1266');

        // ### Job Details
        // - Grade : ATB1 – First-Class Office Assistant
        // - Position : Nurse
        // - Base Index : 200
        // - Responsibility Index (linked to the function): 60
        // #### Adjusted Base Index Calculation
        // - Annual growth rate : 5%
        // - Years of seniority : 10 years
        // > Adjusted Index = Base Index × (1 + growth rate) ^ years of seniority
        // > Adjusted Index = 200 × (1 + 0.05) ^ 10 ≈ 200 × 1.62889 ≈ 325.78
        // Approximate Adjusted Index : 326

        const rubricAdjustedBaseIndex = dataOlivierBenjaminHensley.rubrics.find(
          item => item.rubric_abbr === 'BASE',
        );

        expect(rubricAdjustedBaseIndex.rubric_value).to.equal(326);

        // ### Employee Work Summary
        // - Worked Days : 23
        // - Additional Days : 4
        // - Total Days Counted : 27

        // ### Step 1: Daily Index Calculation
        // We calculate the daily index by dividing the Base Index and Responsibility Index
        // by the number of standard worked days:
        // > Daily Index = (Base Index + Responsibility Index) / Worked Days = (326 + 60) / 23 = 16.782

        // ### Step 2: Adjusted Index Calculation
        // Multiply the Daily Index by the Total Days Worked (including additional days) to get the adjusted index:
        // > Adjusted Index = Daily Index × Total Days = 16.782 × 27 ≈ 453.13

        const rubricDailyIndexCalculation = dataOlivierBenjaminHensley.rubrics.find(
          item => item.rubric_abbr === 'BJ-PRS',
        );

        const dailyIndexCalculation = Math.round(rubricDailyIndexCalculation.rubric_value * 100) / 100;
        expect(dailyIndexCalculation).to.equal(453.13);

        // ### Additional Indexed Benefits
        // - Night Shift Bonus – Indexed : 2
        // - Overtime – Indexed : 3
        // > Base Salary and Indexed Benefits = 453.130435 + 2 + 3 = 458.130435

        const rubricBaseSalaryIndexed = dataOlivierBenjaminHensley.rubrics.find(
          item => item.rubric_abbr === 'BAV-IND',
        );

        const baseSalaryIndexed = Math.round(rubricBaseSalaryIndexed.rubric_value * 10000) / 10000;
        expect(baseSalaryIndexed).to.equal(458.1304);

        // ### Remuneration Rate Calculation
        // For all configured employees, the system has calculated:
        // - SUM of BASE SALARY AND INDEXED BENEFITS = 53,232.52
        // - Total Payroll Envelope = $14,000
        // > PAY RATE = 14,000 / 53,232.52 ≈ 0.26 (0.263)
        const rubricPayRate = dataOlivierBenjaminHensley.rubrics.find(
          item => item.rubric_abbr === 'TX-REM',
        );
        expect(rubricPayRate.rubric_value).to.equal(0.263);

        // ### Final Gross Pay
        // The Gross Amount to be Paid for the employee is calculated as:
        // > GROSS SALARY = BASE SALARY AND INDEXED BENEFITS × REMUNERATION RATE = 458.1304 × 0.26 ≈ $120.49

        const rubricGrossSalary = dataOlivierBenjaminHensley.rubrics.find(
          item => item.rubric_abbr === 'MBP-IND',
        );
        expect(rubricGrossSalary.rubric_value).to.equal(120.49);

      })
      .catch(helpers.handler);
  });

  /**
   * test the /multiple_payroll_indice/parameters/ API for Configure Total Payroll Envelope
   * check: Payroll Envelope : $30,000
   */
  it('POST /multiple_payroll/:id/ Payroll Management: Continuity of Work For Employees Amelia Rose Thornton', () => {
    return agent.post('/multiple_payroll_indice/parameters/')
      .send(paramsPayEnvelope1)
      .then((res) => {
        expect(res).to.have.status(201);

        return agent.get('/multiple_payroll_indice/')
          .query(queryParameters);
      })
      .then((res) => {
        // Olivier Benjamin Hensley
        // EM.TE.1266
        // Hiring Date : January 1, 2015
        // Seniority**: 10 years (as of January 1, 2025)

        const dataOlivierBenjaminHensley = res.body.employees.find(item => item.employee_reference === 'EM.TE.1266');

        // ### Job Details
        // - Grade : ATB1 – First-Class Office Assistant
        // - Position : Nurse
        // - Base Index : 200
        // - Responsibility Index (linked to the function): 60
        // #### Adjusted Base Index Calculation
        // - Annual growth rate : 5%
        // - Years of seniority : 10 years
        // > Adjusted Index = Base Index × (1 + growth rate) ^ years of seniority
        // > Adjusted Index = 200 × (1 + 0.05) ^ 10 ≈ 200 × 1.62889 ≈ 325.78
        // Approximate Adjusted Index : 326

        const rubricAdjustedBaseIndex = dataOlivierBenjaminHensley.rubrics.find(
          item => item.rubric_abbr === 'BASE',
        );

        expect(rubricAdjustedBaseIndex.rubric_value).to.equal(326);

        // ### Employee Work Summary
        // - Worked Days : 23
        // - Additional Days : 4
        // - Total Days Counted : 27

        // ### Step 1: Daily Index Calculation
        // We calculate the daily index by dividing the Base Index and Responsibility Index
        // by the number of standard worked days:
        // > Daily Index = (Base Index + Responsibility Index) / Worked Days = (326 + 60) / 23 = 16.782

        // ### Step 2: Adjusted Index Calculation
        // Multiply the Daily Index by the Total Days Worked (including additional days) to get the adjusted index:
        // > Adjusted Index = Daily Index × Total Days = 16.782 × 27 ≈ 453.13

        const rubricDailyIndexCalculation = dataOlivierBenjaminHensley.rubrics.find(
          item => item.rubric_abbr === 'BJ-PRS',
        );

        const dailyIndexCalculation = Math.round(rubricDailyIndexCalculation.rubric_value * 100) / 100;
        expect(dailyIndexCalculation).to.equal(453.13);

        // ### Additional Indexed Benefits
        // - Night Shift Bonus – Indexed : 2
        // - Overtime – Indexed : 3
        // > Base Salary and Indexed Benefits = 453.130435 + 2 + 3 = 458.130435

        const rubricBaseSalaryIndexed = dataOlivierBenjaminHensley.rubrics.find(
          item => item.rubric_abbr === 'BAV-IND',
        );

        const baseSalaryIndexed = Math.round(rubricBaseSalaryIndexed.rubric_value * 10000) / 10000;
        expect(baseSalaryIndexed).to.equal(458.1304);

        // ### Remuneration Rate Calculation
        // For all configured employees, the system has calculated:
        // - SUM of BASE SALARY AND INDEXED BENEFITS = 53,232.52
        // - Total Payroll Envelope = $30,000
        // > PAY RATE = 30,000 / 53,232.52 ≈ 0.5636 (0.263)
        const rubricPayRate = dataOlivierBenjaminHensley.rubrics.find(
          item => item.rubric_abbr === 'TX-REM',
        );
        expect(rubricPayRate.rubric_value).to.equal(0.5636);

        // ### Final Gross Pay
        // The Gross Amount to be Paid for the employee is calculated as:
        // > GROSS SALARY = BASE SALARY AND INDEXED BENEFITS × REMUNERATION RATE = 458.1304 × 0.5636 ≈ $258.19

        const rubricGrossSalary = dataOlivierBenjaminHensley.rubrics.find(
          item => item.rubric_abbr === 'MBP-IND',
        );
        expect(rubricGrossSalary.rubric_value).to.equal(258.19);

      })
      .catch(helpers.handler);
  });

  /**
   * test the /multiple_payroll_indice/upload/ API for importing a payroll Configuration from a csv file
   * where one employee has worked only 1 day during the month.
   */
  it(`POST /multiple_payroll_indice/upload/ upload and import a Payroll Configuration template file,
    where one employee has worked only 1 day during the month.`, () => {
    return agent.post(`/multiple_payroll_indice/upload/${params.periodPaie}`)
      .attach('file', fs.createReadStream(singleEmployee), filenameSingleEmployee)
      .then(res => {
        expect(res).to.have.status(204);
      })
      .catch(helpers.handler);
  });

  /**
   * test the /multiple_payroll_indice/parameters/ API for Configure Total Payroll Envelope
   * check: Continuity of Work For Employees Amelia Rose Thornton worked a single day
   */
  it(`POST /multiple_payroll/:id/ Payroll Management: Continuity of Work For Employees Amelia Rose Thornton
    worked a single day`, () => {
    return agent.post('/multiple_payroll_indice/parameters/')
      .send(paramsPayEnvelope)
      .then((res) => {
        expect(res).to.have.status(201);

        return agent.get('/multiple_payroll_indice/')
          .query(queryParameters);
      })
      .then((res) => {
        // Olivier Benjamin Hensley
        // EM.TE.1266
        // Hiring Date : January 1, 2015
        // Seniority**: 10 years (as of January 1, 2025)

        const dataOlivierBenjaminHensley = res.body.employees.find(item => item.employee_reference === 'EM.TE.1266');

        // ### Job Details
        // - Grade : ATB1 – First-Class Office Assistant
        // - Position : Nurse
        // - Base Index : 200
        // - Responsibility Index (linked to the function): 60
        // #### Adjusted Base Index Calculation
        // - Annual growth rate : 5%
        // - Years of seniority : 10 years
        // > Adjusted Index = Base Index × (1 + growth rate) ^ years of seniority
        // > Adjusted Index = 200 × (1 + 0.05) ^ 10 ≈ 200 × 1.62889 ≈ 325.78
        // Approximate Adjusted Index : 326

        const rubricAdjustedBaseIndex = dataOlivierBenjaminHensley.rubrics.find(
          item => item.rubric_abbr === 'BASE',
        );

        expect(rubricAdjustedBaseIndex.rubric_value).to.equal(326);

        // ### Employee Work Summary
        // - Worked Days : 1 (Single Day)
        // - Additional Days : 0
        // - Total Days Counted : 1

        // ### Step 1: Daily Index Calculation
        // We calculate the daily index by dividing the Base Index and Responsibility Index
        // by the number of standard worked days:
        // > Daily Index = (Base Index + Responsibility Index) / Worked Days = (326 + 60) / 23 = 16.782

        // ### Step 2: Adjusted Index Calculation
        // Multiply the Daily Index by the Total Days Worked (including additional days) to get the adjusted index:
        // > Adjusted Index = Daily Index × Total Days = 16.782 × 1 ≈ 16.78

        const rubricDailyIndexCalculation = dataOlivierBenjaminHensley.rubrics.find(
          item => item.rubric_abbr === 'BJ-PRS',
        );

        const dailyIndexCalculation = Math.round(rubricDailyIndexCalculation.rubric_value * 100) / 100;
        expect(dailyIndexCalculation).to.equal(16.78);

        // ### Additional Indexed Benefits
        // - Night Shift Bonus – Indexed : 0
        // - Overtime – Indexed : 0
        // > Base Salary and Indexed Benefits = 16.78 + 0 + 0 = 16.78

        const rubricBaseSalaryIndexed = dataOlivierBenjaminHensley.rubrics.find(
          item => item.rubric_abbr === 'BAV-IND',
        );

        const baseSalaryIndexed = Math.round(rubricBaseSalaryIndexed.rubric_value * 100) / 100;
        expect(baseSalaryIndexed).to.equal(16.78);

        // ### Remuneration Rate Calculation
        // For all configured employees, the system has calculated:
        // - SUM of BASE SALARY AND INDEXED BENEFITS = 52,767.13
        // - Total Payroll Envelope = $14,000
        // > PAY RATE = 14,000 / 53,203 ≈ 0.26 (0.2652)
        const rubricPayRate = dataOlivierBenjaminHensley.rubrics.find(
          item => item.rubric_abbr === 'TX-REM',
        );
        expect(rubricPayRate.rubric_value).to.equal(0.2652);

        // ### Final Gross Pay
        // The Gross Amount to be Paid for the employee is calculated as:
        // > GROSS SALARY = BASE SALARY AND INDEXED BENEFITS × REMUNERATION RATE = 16.782 × 0.265 ≈ $4.45

        const rubricGrossSalary = dataOlivierBenjaminHensley.rubrics.find(
          item => item.rubric_abbr === 'MBP-IND',
        );
        expect(rubricGrossSalary.rubric_value).to.equal(4.45);

      })
      .catch(helpers.handler);
  });
});
