/* global expect, agent */
const fs = require('fs');
const helpers = require('../helpers');

describe(`Tests to verify that enabling "Payment by Index"
  correctly updates the BHIMA system for index-based payments`, () => {
  /**
   * This test validates the functional configuration of an employee within the
   * BHIMA payroll system under the "Payment by Index" scheme.
   *
   * According to the project specification (Key Deliverable No. 2: Functional Tests
   * of Payroll Modules), each employee must be configured with a complete set of
   * payroll rubrics to ensure accurate salary computation and integration with
   * the multi-payroll module.
   *
   * Specifically, this test ensures that an employee record can be successfully
   * set up with at least the following mandatory rubrics:
   *
   * 1. A rubric for taxes (e.g., IPR)
   * 2. A rubric for deductions (e.g., salary advance)
   * 3. A rubric for responsibility bonus
   * 4. A rubric for family allowances (e.g., two children)
   *
   * The test confirms that:
   * - All required rubrics are correctly created, assigned, and linked to the
   *   employee configuration.
   * - The payroll system can subsequently process the employee’s salary using
   *   the “Payment by Index” workflow without error.
   * - The configuration aligns with the expected functional behavior defined
   *   in the payroll module’s test deliverables.
   */
  let payrollConfigId;
  let rubricConfigId;

  /**
   * This test verifies the successful creation of a payroll rubric configuration
   * within the BHIMA payroll system as part of the “Payment by Index” workflow.
   *
   * According to the functional requirements, each payroll process must rely on
   * a valid rubric configuration that defines all applicable salary components
   * (such as taxes, bonuses, deductions, and allowances).
   *
   * In this scenario, the test performs the following validations:
   * 1. It submits a POST request to the `/payroll/rubric_config` API endpoint
   *    with a predefined set of rubric identifiers.
   * 2. It ensures that the rubric configuration is properly registered and that
   *    the API returns a successful creation response (HTTP 201).
   * 3. It stores the returned rubric configuration ID (`rubricConfigId`) for
   *    subsequent test steps, such as employee setup and payroll computation.
   *
   * The test confirms that the system can correctly initialize a complete set
   * of payroll rubrics, which is a prerequisite for running both unit and
   * integration tests in the payroll-by-index module.
   */
  it('Employee Payroll Rubric Configuration', async () => {
    try {
      const rubricConfig = {
        items : [2, 12, 13, 15, 17, 18, 20, 21, 22, 23, 32, 39, 4, 44],
        label : 'Rubrics test payroll',
      };

      const res = await agent.post('/payroll/rubric_config').send(rubricConfig);
      rubricConfigId = res.body.id;

      // Verify that the creation was successful
      expect(res).to.have.status(201);
    } catch (err) {
      helpers.handler(err);
    }
  });

  /**
   * This test validates the employee function and responsibility bonus configuration
   * workflow within the BHIMA payroll system under the “Payment by Index” scheme.
   *
   * According to the functional specification (Key Deliverable No. 2: Functional Tests
   * of Payroll Modules), each employee must be correctly assigned to a job function
   * and, where applicable, receive a responsibility bonus that can be granted either
   * through the function assignment or by direct configuration.
   *
   * The scenario covers the following steps:
   *
   * 1. Create a new job function ("Senior Accountant") in the system.
   * 2. Assign a function index value (e.g., 120) representing the function’s weight
   *    in payroll calculations.
   * 3. Assign this new function to an employee (Adam Smith Johnson).
   * 4. Assign another existing function to a second employee (Michael Adams Nelson)
   *    to ensure consistency across different role setups.
   * 5. Configure a third employee (Youssouf Sangaré Coulibaly) with both grade and
   *    function indices (520 and 155) to validate multi-index behavior.
   *
   * This test ensures that:
   * - Functions and responsibility bonuses can be created, linked, and assigned
   *   correctly at both the function and employee levels.
   * - Employee records are properly updated and stored with their assigned function IDs.
   * - The resulting configuration is ready for subsequent payroll computation
   *   using the multi-payroll index module.
   *
   * Successful execution confirms that the system supports both hierarchical
   * (via function) and direct responsibility bonus assignments in accordance with
   * the payroll module’s functional requirements.
   */
  it(`should create a new function,
    configure responsibility bonus, assign the function and the bonus to an employee`, async () => {
    // Define a new job function
    const newFunction = { fonction_txt : 'Senior Accountant' };

    // Create the function in the system
    const functionRes = await agent.post('/functions').send(newFunction);

    expect(functionRes).to.have.status(201);
    newFunction.id = functionRes.body.id;

    const staffingFunctionIndice = {
      fonction_id : newFunction.id,
      value : 120,
    };

    const staffingFunction = await agent.post('/staffing_function_indices').send(staffingFunctionIndice);
    expect(staffingFunction).to.have.status(201);

    // Adam Smith Johnson
    const employee1 = '8FAC0B70C12B423FB575324751448F4F';
    const employee1Update = {
      code : 'EMP-STAFF-01101',
      display_name : 'Adam Smith Johnson',
      sex : 'M',
      dob : '1960-03-04',
      hiring_date : '2015-02-28',
      service_uuid : null,
      nb_spouse : 0,
      nb_enfant : 0,
      grade_uuid : '4FDA78D1C73C4789AAC14736A4CCEC37',
      locked : 0,
      is_medical : null,
      basic_salary : 375,
      fonction_id : newFunction.id,
      fonction_txt : null,
      service_txt : null,
      hospital_no : 'TEST-FILE-101',
      phone : null,
      email : null,
      adresse : null,
      patient_uuid : 'B5132D4875EA4964B13854DC60163368',
      bank : null,
      bank_account : null,
      title_employee_id : null,
      title_txt : null,
      individual_salary : 0,
      debtor_uuid : '968ABEC0BB0A4DC08921580A491BC667',
      debtor_group_uuid : 'F1921FEEA76C4F3693A96A6535BC7A59',
      creditor_uuid : '1CE426B3A10C48DA8065206F6EF1F78B',
      creditor_group_uuid : 'EED3E01C64954A05897AC5162BAB146C',
      account_id : 366,
      current_location_id : '1F162A109F6747889EFFC1FEA42FCC9B',
      origin_location_id : '1F162A109F6747889EFFC1FEA42FCC9B',
      displayAge : 65,
    };

    const employee1Function = await agent.put(`/employees/${employee1}`).send(employee1Update);
    expect(employee1Function).to.have.status(200);

    // Michael Adams Nelson
    const employee2 = 'B40A379479D4438F89CBD85CEA739482';
    const employee2Update = {
      code : 'EMP-STAFF-01226',
      display_name : 'Michael Adams Nelson',
      sex : 'M',
      dob : '1967-10-24',
      hiring_date : '1995-06-30',
      service_uuid : null,
      nb_spouse : 0,
      nb_enfant : 2,
      grade_uuid : 'C6435326224447519EC1ECC556508284',
      locked : 0,
      is_medical : null,
      basic_salary : 150,
      fonction_id : 1,
      fonction_txt : null,
      service_txt : null,
      hospital_no : 'TEST-FILE-226',
      phone : null,
      email : null,
      adresse : null,
      patient_uuid : '49C76C17B0B548A5951BC48D792BC7E6',
      bank : null,
      bank_account : null,
      title_employee_id : null,
      title_txt : null,
      individual_salary : 0,
      code_grade : 'AB1',
      debtor_uuid : 'BA87BD78225B443491BD6D6166610261',
      debtor_text : 'Debiteur [Michael Adams Nelson]',
      debtor_group_uuid : 'F1921FEEA76C4F3693A96A6535BC7A59',
      reference : 'EM.TE.1235',
      creditor_uuid : '6B65FB9419AB42948FE82D142FFC084A',
      creditor_text : 'Crediteur [Michael Adams Nelson]',
      creditor_group_uuid : 'EED3E01C64954A05897AC5162BAB146C',
      account_id : 366,
      current_location_id : '1F162A109F6747889EFFC1FEA42FCC9B',
      origin_location_id : '1F162A109F6747889EFFC1FEA42FCC9B',
      displayGender : 'M',
      displayAge : 58,
    };

    const employee2Function = await agent.put(`/employees/${employee2}`).send(employee2Update);
    expect(employee2Function).to.have.status(200);

    // Employee responsability
    // Youssouf Sangaré Coulibaly
    const employeeStaffingIndice = {
      employee_uuid : '914C7806BDEE44999B4A6B97FF7C585A',
      grade_uuid : '082F7EBBB69D4279820B07E5440639F0',
      grade_indice : '520',
      function_indice : '155',
    };

    const EmployeeResponsability = await agent.post('/staffing_indices').send(employeeStaffingIndice);
    expect(EmployeeResponsability).to.have.status(201);

  });

  /**
   * This test validates the creation of a new payroll period configuration.
   *
   * It ensures that the system can successfully register a payroll period
   * with all required parameters, including:
   *
   * 1. The period label and date range.
   * 2. The linked employee configuration (structure or template).
   * 3. The rubric configuration defining applicable payroll items.
   * 4. The accounting setup associated with the payroll.
   * 5. The weekend and IPR (income tax) configurations.
   *
   * The test confirms that when all parameters are correctly provided,
   * the system creates the payroll configuration and returns a 201 (Created) status.
   */
  it('Payroll Period Configuration', async () => {
    try {
      const payrollConfig = {
        label : 'Periode test',
        dateFrom : '2024-12-01',
        dateTo : '2024-12-31',
        config_employee_id : 3,
        config_rubric_id : rubricConfigId,
        config_accounting_id : 1,
        config_weekend_id : 1,
        config_ipr_id : 1,
      };

      const res = await agent.post('/payroll_config').send(payrollConfig);
      payrollConfigId = res.body.id;
      // Verify that the creation was successful
      expect(res).to.have.status(201);
    } catch (err) {
      helpers.handler(err);
    }
  });

  /**
   * This test verifies the successful upload and import of a Payroll Configuration
   * template file into the system.
   *
   * The uploaded CSV file (`multi_payment_index_system.csv`) contains payroll index
   * definitions used to configure multiple employee payment parameters for a given
   * payroll period.
   *
   * Steps verified by this test:
   * 1. Read and attach the payroll configuration CSV file.
   * 2. Upload the file to the endpoint `/multiple_payroll_indice/upload/:payrollConfigId`.
   * 3. Confirm that the system processes the file correctly and returns a 204 (No Content) status.
   *
   * The test ensures that the payroll index import mechanism is functional, stable,
   * and properly linked to the existing payroll configuration.
   */
  it(`POST /multiple_payroll_indice/upload/ upload and import a Payroll Configuration template file`, async () => {
    const file = './test/fixtures/multi_payment_index_system.csv';
    const filename = 'multi_payment_index_system.csv';

    try {
      const res = await agent.post(`/multiple_payroll_indice/upload/${payrollConfigId}`)
        .attach('file', fs.createReadStream(file), filename);
      // Confirm that the payroll configuration was successfully created.
      expect(res).to.have.status(204);
    } catch (err) {
      helpers.handler(err);
    }
  });

  /**
   * This test verifies the configuration of the Total Payroll Envelope
   * through the `/multiple_payroll_indice/parameters/` API endpoint.
   *
   * It ensures that the system correctly registers key payroll parameters,
   * including:
   *  - The total payroll envelope amount (`pay_envelope`)
   *  - The total number of working days (`working_days`)
   *  - The selected language and pension fund options
   *
   * Successful creation (HTTP 201) confirms that the payroll setup
   * process is functional and that the payroll management system
   */
  it(`POST /multiple_payroll/:id/ Payroll Management: Continuity of Work
    For Employees Amelia Rose Thornton`, async () => {
    const paramsPayEnvelope = {
      payroll_configuration_id : payrollConfigId,
      pay_envelope : 20000,
      working_days : '22',
      lang : 'fr',
      pension_fund : 0,
    };

    try {
      const res = await agent.post('/multiple_payroll_indice/parameters/').send(paramsPayEnvelope);
      // Assert that the payroll configuration was successfully created and accepted by the system
      expect(res).to.have.status(201);
    } catch (err) {
      helpers.handler(err);
    }
  });

  /**
   * Test Scenario: Multi-Employee Payroll Configuration and Validation
   *
   * This test validates the end-to-end payroll processing for multiple employees
   * using the `/multiple_payroll/:id/multiConfiguration` API. It ensures that
   * payroll configurations, indices, rubrics, and deductions are correctly applied
   * to each employee according to their individual salary, function, and benefits.
   *
   * Employees under test:
   * - Adam Smith Johnson
   * - Michael Adams Nelson
   * - Youssouf Sangaré Coulibaly
   *
   * Test Steps:
   * 1. Configure payroll for multiple employees, including salary, indices, and working days.
   * 2. Submit the multi-configuration request to the payroll system.
   * 3. Validate that the POST request was successful (HTTP 201).
   * 4. Retrieve payroll indices for all configured employees.
   * 5. Retrieve the payroll report (payslip) for all configured employees.
   * 6. Verify HTTP responses for both indices and payroll report (HTTP 200).
   *
   * Detailed Employee Verification:
   * - For each employee:
   *   1. Verify base index, responsibility index, worked days, and total days.
   *   2. Calculate and verify the daily index and adjusted index.
   *   3. Validate the base salary and indexed benefits (BAV-IND).
   *   4. Verify the remuneration rate (TX-REM) and calculate gross salary (MBP-IND).
   *   5. Validate all deductions:
   *      - Salary Advance
   *      - INSS QPO
   *      - IPR (Income Tax)
   *   6. Compute and verify net salary.
   *
   * Calculations are cross-checked for accuracy, including:
   * - Daily index = (Base Index + Responsibility Index) / Worked Days
   * - Adjusted index = Daily Index × Total Days
   * - Gross Salary = Base Salary & Indexed Benefits × Remuneration Rate
   * - Total deductions = sum of all applicable deductions
   * - Net Salary = Gross Salary - Total Deductions
   *
   * This test ensures that the payroll system correctly computes salaries,
   * indices, and tax/deduction rules for multiple employees, and that the
   * reported values in the payroll report match the calculated expectations.
   */
  it(`POST /multiple_payroll/:id/(multi)configuration pour le paiement des employées`, async () => {
    const employees = [
      {
        employee_uuid : '8FAC0B70C12B423FB575324751448F4F',
        reference : 1110,
        code : 'EMP-STAFF-01101',
        hiring_date : '2015-02-28T00 :00 :00.000Z',
        nb_enfant : 0,
        individual_salary : 196,
        account_id : 366,
        creditor_uuid : '1CE426B3A10C48DA8065206F6EF1F78B',
        function_name : 'Senior Accountant',
        display_name : 'ADAM SMITH JOHNSON',
        sex : 'M',
        payment_uuid : null,
        payroll_configuration_id : '22',
        currency_id : '2',
        payment_date : null,
        base_taxable : 0,
        basic_salary : 0,
        gross_salary : 0,
        grade_salary : 375,
        text : 'Médecin interne',
        net_salary : 0,
        working_day : 0,
        total_day : 0,
        daily_salary : 0,
        amount_paid : 0,
        status_id : 1,
        status : 'PAYROLL_STATUS.WAITING_FOR_CONFIGURATION',
        balance : 0,
        hrreference : 'EM.TE.1110',
        cost_center_id : null,
        service_name : null,
        negativeValue : 0,
      },
      {
        employee_uuid : 'B40A379479D4438F89CBD85CEA739482',
        reference : 1235,
        code : 'EMP-STAFF-01226',
        hiring_date : '1995-06-30T00 :00 :00.000Z',
        nb_enfant : 2,
        individual_salary : 207.78,
        account_id : 366,
        creditor_uuid : '6B65FB9419AB42948FE82D142FFC084A',
        function_name : 'Infirmier',
        display_name : 'MICHAEL ADAMS NELSON',
        sex : 'M',
        payment_uuid : null,
        payroll_configuration_id : '22',
        currency_id : '2',
        payment_date : null,
        base_taxable : 0,
        basic_salary : 0,
        gross_salary : 0,
        grade_salary : 150,
        text : 'Agent de bureau de 1ère classe',
        net_salary : 0,
        working_day : 0,
        total_day : 0,
        daily_salary : 0,
        amount_paid : 0,
        status_id : 1,
        status : 'PAYROLL_STATUS.WAITING_FOR_CONFIGURATION',
        balance : 0,
        hrreference : 'EM.TE.1235',
        cost_center_id : null,
        service_name : null,
        negativeValue : 0,
      },
      {
        employee_uuid : '914C7806BDEE44999B4A6B97FF7C585A',
        reference : 1095,
        code : 'EMP-STAFF-01086',
        hiring_date : '2009-03-31T23 :00 :00.000Z',
        nb_enfant : 0,
        individual_salary : 227.32,
        account_id : 366,
        creditor_uuid : '51349F3DC7084E32805EEB1F332EC419',
        function_name : null,
        display_name : 'YOUSSOUF SANGARÉ COULIBALY',
        sex : 'M',
        payment_uuid : null,
        payroll_configuration_id : '22',
        currency_id : '2',
        payment_date : null,
        base_taxable : 0,
        basic_salary : 0,
        gross_salary : 0,
        grade_salary : 250,
        text : 'Des hôpitaux 1ère échelon',
        net_salary : 0,
        working_day : 0,
        total_day : 0,
        daily_salary : 0,
        amount_paid : 0,
        status_id : 1,
        status : 'PAYROLL_STATUS.WAITING_FOR_CONFIGURATION',
        balance : 0,
        hrreference : 'EM.TE.1095',
        cost_center_id : null,
        service_name : null,
        negativeValue : 0,
      },
    ];

    const dataMultiConfiguration = {
      data : {
        employees,
        currencyId : 2,
      },
    };

    const parametersIndice = {
      currency_id : 2,
      payroll_configuration_id : payrollConfigId,
    };

    const paramGeneralReport = {
      currency_id : '2',
      displayValues : '',
      employees : [
        '8FAC0B70C12B423FB575324751448F4F',
        'B40A379479D4438F89CBD85CEA739482',
        '914C7806BDEE44999B4A6B97FF7C585A',
      ],
      lang : 'fr',
      payroll_configuration_id : payrollConfigId,
      renderer : 'json',
    };

    try {
      const resPost = await agent
        .post(`/multiple_payroll/${payrollConfigId}/multiConfiguration`)
        .send(dataMultiConfiguration);

      // Check that the POST request was successful
      expect(resPost).to.have.status(201);

      // Fetch payroll system values with index details for verification
      const resPayrollIndice = await agent
        .get('/multiple_payroll_indice/')
        .query(parametersIndice);

      const resPayroll = await agent
        .get('/reports/payroll/payslip')
        .query(paramGeneralReport);

      // Verify that both GET requests succeeded
      // - Payroll indices retrieved successfully (HTTP 200)
      // - Payroll report retrieved successfully (HTTP 200)
      expect(resPayrollIndice).to.have.status(200);
      expect(resPayroll).to.have.status(200);

      /**
      * ADAM SMITH JOHNSON
      */
      const dataIndiceEmployee1 = resPayrollIndice.body.employees.find(
        item => item.employee_reference === 'EM.TE.1110');

      const dataEmployee1 = resPayroll.body.dataEmployees.find(
        item => item.employee_uuid === '8FAC0B70C12B423FB575324751448F4F',
      );

      // EM.TE.1110
      // - Base Index : 582
      expect(dataEmployee1.is_base_index.value).to.equal(582);
      // - Responsibility Index (linked to the function): 0
      // - Worked Days : 22
      expect(dataEmployee1.is_day_worked.value).to.equal(22);
      // - Additional Days : 0
      // - Total Days Counted : 22
      expect(dataEmployee1.is_total_days.value).to.equal(22);
      // ### Step 1: Daily Index Calculation
      // We calculate the daily index by dividing the Base Index and Responsibility Index
      // by the number of standard worked days:
      // > Daily Index = (Base Index + Responsibility Index) / Worked Days = (582 + 0) / 22 = 26.45

      // Multiply the Daily Index by the Total Days Worked (including additional days) to get the adjusted index:
      // > Adjusted Index = Daily Index × Total Days = 26.45 × 22 ≈ 582
      expect(dataEmployee1.is_reagistered_index.value).to.equal(582);
      // > Base Salary and Indexed Benefits = 582 + 0 = 582

      const rubricBaseSalaryIndexed1 = dataIndiceEmployee1.rubrics.find(
        item => item.rubric_abbr === 'BAV-IND',
      );

      expect(rubricBaseSalaryIndexed1.rubric_value).to.equal(582);
      // ### Remuneration Rate Calculation
      // For all configured employees, the system has calculated:
      // - SUM of BASE SALARY AND INDEXED BENEFITS = 59,388.63
      // - Total Payroll Envelope = $20,000
      // > PAY RATE = 20,000 / 59,388.63 ≈ 0.3368
      const rubricPayRate1 = dataIndiceEmployee1.rubrics.find(
        item => item.rubric_abbr === 'TX-REM',
      );
      expect(rubricPayRate1.rubric_value).to.equal(0.3368);
      // ### Final Gross Pay
      // The Gross Amount to be Paid for the employee is calculated as:
      // > GROSS SALARY = BASE SALARY AND INDEXED BENEFITS × REMUNERATION RATE = 582 × 0.3368 ≈ $196
      const rubricGrossSalary1 = dataIndiceEmployee1.rubrics.find(
        item => item.rubric_abbr === 'MBP-IND',
      );
      expect(rubricGrossSalary1.rubric_value).to.equal(196);

      // Verify calculated payroll values for the employee:
      // - Base Index: $196
      // - Responsibility Index (linked to the function): $60
      // - INSS QPO (3.5%): 196 × 0.035 = $6.86
      expect(dataEmployee1.rubricDiscount.find(
        item => item.abbr === 'INSSQ').result_equiv).to.equal(6.86);

      // Summary
      // Base Salary: $196.00
      // Net Taxable: $0.00
      // Net Non-Taxable: $0.00
      // Gross Salary: $196.00
      expect(dataEmployee1.gross_salary_equiv).to.equal(196);

      // IPR Base ($): 196.00 - 6.86 = $189.14

      // IPR Base (FC): 175,900  CDF6.86
      // IPR Base Annual (FC) : 2,110,802.40 CDF
      // #### IPR Tax Band:
      // Falls within: `1,428,000 CDF – 2,700,000 CDF
      // #### Calculation:
      // Difference: `2,110,802.40 - 1,428,000 = 682,802 CDF
      // Tax: `682,802 × 0.2 = 136,560.4 CDF
      // Add lower bracket cumulative: `136,560.4 + 135,576  = 272,136.4 CDF
      // Monthly IPR: `272,136.4 / 12 = 22,678  CDF`
      // Converted to USD: `22,678 / 930 ≈ $24.38`

      expect(dataEmployee1.rubricDiscount.find(
        item => item.abbr === 'IPR').result_equiv).to.equal(24.38);

      // Total Deductions
      // Salary Advance                        | $0.00   |
      // INSS QPO (3.5%)                       | $6.86   |
      // IPR                                   | $24.38  |
      // Total Deductions                      | $31.24  |
      const totalDeduction1 = Math.round(dataEmployee1.somChargeEmployee_equiv * 100) / 100;
      expect(totalDeduction1).to.equal(31.24);
      // Net Salary Calculation
      // Gross Salary: `$196`
      // Deductions:   `$31.24`
      // Net Salary:   `$164.76`
      expect(dataEmployee1.net_salary_equiv).to.equal(164.76);

      /**
      * MICHAEL ADAMS NELSON
      */
      const dataIndiceEmployee2 = resPayrollIndice.body.employees.find(
        item => item.employee_reference === 'EM.TE.1235');

      const dataEmployee2 = resPayroll.body.dataEmployees.find(
        item => item.employee_uuid === 'B40A379479D4438F89CBD85CEA739482',
      );

      // EM.TE.1235
      // - Base Index : 617
      expect(dataEmployee2.is_base_index.value).to.equal(617);
      // - Responsibility Index (linked to the function): 0
      // - Worked Days : 22
      expect(dataEmployee2.is_day_worked.value).to.equal(22);
      // - Additional Days : 0
      // - Total Days Counted : 22
      expect(dataEmployee2.is_total_days.value).to.equal(22);
      // ### Step 1: Daily Index Calculation
      // We calculate the daily index by dividing the Base Index and Responsibility Index
      // by the number of standard worked days:
      // > Daily Index = (Base Index + Responsibility Index) / Worked Days = (617 + 0) / 22 = 28.05

      // Multiply the Daily Index by the Total Days Worked (including additional days) to get the adjusted index:
      // > Adjusted Index = Daily Index × Total Days = 26.45 × 22 ≈ 617
      expect(dataEmployee2.is_reagistered_index.value).to.equal(617);
      // > Base Salary and Indexed Benefits = 617 + 0 = 617

      const rubricBaseSalaryIndexed2 = dataIndiceEmployee2.rubrics.find(
        item => item.rubric_abbr === 'BAV-IND',
      );

      expect(rubricBaseSalaryIndexed2.rubric_value).to.equal(617);
      // ### Remuneration Rate Calculation
      // For all configured employees, the system has calculated:
      // - SUM of BASE SALARY AND INDEXED BENEFITS = 59,388.63
      // - Total Payroll Envelope = $20,000
      // > PAY RATE = 20,000 / 59,388.63 ≈ 0.3368
      const rubricPayRate2 = dataIndiceEmployee2.rubrics.find(
        item => item.rubric_abbr === 'TX-REM',
      );
      expect(rubricPayRate2.rubric_value).to.equal(0.3368);
      // ### Final Gross Pay
      // The Gros Amount to be Paid for the employee is calculated as:
      // > GROSS SALARY = BASE SALARY AND INDEXED BENEFITS × REMUNERATION RATE = 617 × 0.3368 ≈ $207.78
      const rubricGrossSalary2 = dataIndiceEmployee2.rubrics.find(
        item => item.rubric_abbr === 'MBP-IND',
      );
      expect(rubricGrossSalary2.rubric_value).to.equal(207.78);

      // Verify calculated payroll values for the employee:
      // - Base Index : $207.78
      // - Responsibility Index (linked to the function): 0
      // INSS QPO (3.5%): `207.78 × 0.035 = $7.27
      expect(dataEmployee2.rubricDiscount.find(
        item => item.abbr === 'INSSQ').result_equiv).to.equal(7.27);

      // Summary
      // Base Salary: $207.78
      // Net Taxable: $0.00
      // Net Non-Taxable: $0.00
      // Gross Salary: $207.78
      expect(dataEmployee2.gross_salary_equiv).to.equal(207.78);

      // IPR Base ($): 207.78 - 7.27 = $200.51
      // IPR Base (FC): 186.472 CDF
      // IPR Base Annual (FC) : 2,237,665.93 CDF
      // #### IPR Tax Band:
      // Falls within: `1,428,000 CDF – 2,700,000 CDF
      // #### Calculation:
      // Difference: `2,237,665.93 - 1,428,000 = 809,665 CDF
      // Tax: `809,665 × 0.2 = 161,933 CDF
      // Add lower bracket cumulative: `161,933 + 135,576  = 297,509 CDF
      // Monthly IPR: `297,509 / 12 = 24,792.41 CDF`
      // Converted to USD: `24,792.41 / 930 ≈ $26.659`
      // ### Dependent Reduction
      // 2 children → `$26.659 × 0.02 × 2 = $1.06
      // Final IPR = `$26.66 - 1.06 = $25.59

      expect(dataEmployee2.rubricDiscount.find(
        item => item.abbr === 'IPR').result_equiv).to.equal(25.59);

      // Total Deductions
      // Salary Advance                        | $50.00  |
      // INSS QPO (3.5%)                       | $7.27   |
      // IPR                                   | $25.59  |
      // Total Deductions                      | $82.86  |
      const totalDeduction2 = Math.round(dataEmployee2.somChargeEmployee_equiv * 100) / 100;
      expect(totalDeduction2).to.equal(82.86);
      // Net Salary Calculation
      // Gross Salary: `$207.78`
      // Deductions:   `$82.86`
      // Net Salary:   `$124.92`
      expect(dataEmployee2.net_salary_equiv).to.equal(124.92);

      /**
      * YOUSSOUF SANGARÉ COULIBALY
      */
      const dataIndiceEmployee3 = resPayrollIndice.body.employees.find(
        item => item.employee_reference === 'EM.TE.1095');

      const dataEmployee3 = resPayroll.body.dataEmployees.find(
        item => item.employee_uuid === '914C7806BDEE44999B4A6B97FF7C585A',
      );

      // EM.TE.1235
      // - Base Index : 520
      // - Responsibility Index (linked to the function): 155
      expect(dataEmployee3.is_base_index.value).to.equal(520);
      // - Responsibility Index (linked to the function): 0
      // - Worked Days : 22
      expect(dataEmployee3.is_day_worked.value).to.equal(22);
      // - Additional Days : 0
      // - Total Days Counted : 22
      expect(dataEmployee3.is_total_days.value).to.equal(22);
      // ### Step 1: Daily Index Calculation
      // We calculate the daily index by dividing the Base Index and Responsibility Index
      // by the number of standard worked days:
      // > Daily Index = (Base Index + Responsibility Index) / Worked Days = (520 + 155) / 22 = 30.681

      // Multiply the Daily Index by the Total Days Worked (including additional days) to get the adjusted index:
      // > Adjusted Index = Daily Index × Total Days =  30.681 × 22 ≈ 675
      expect(dataEmployee3.is_reagistered_index.value).to.equal(675);
      // > Base Salary and Indexed Benefits = 675 + 0 = 675

      const rubricBaseSalaryIndexed3 = dataIndiceEmployee3.rubrics.find(
        item => item.rubric_abbr === 'BAV-IND',
      );

      expect(rubricBaseSalaryIndexed3.rubric_value).to.equal(675);
      // ### Remuneration Rate Calculation
      // For all configured employees, the system has calculated:
      // - SUM of BASE SALARY AND INDEXED BENEFITS = 59,388.63
      // - Total Payroll Envelope = $20,000
      // > PAY RATE = 20,000 / 59,388.63 ≈ 0.3368
      const rubricPayRate3 = dataIndiceEmployee3.rubrics.find(
        item => item.rubric_abbr === 'TX-REM',
      );
      expect(rubricPayRate3.rubric_value).to.equal(0.3368);
      // ### Final Gross Pay
      // The Gross Amount to be Paid for the employee is calculated as:
      // > GROSS SALARY = BASE SALARY AND INDEXED BENEFITS × REMUNERATION RATE = 675 × 0.3368 ≈ $227.32
      const rubricGrossSalary3 = dataIndiceEmployee3.rubrics.find(
        item => item.rubric_abbr === 'MBP-IND',
      );
      expect(rubricGrossSalary3.rubric_value).to.equal(227.32);

      // Verify calculated payroll values for the employee:
      // - Base Index : $227.32
      // - Responsibility Index (linked to the function): 0
      // INSS QPO (3.5%): `227.32 × 0.035 = $7.96
      expect(dataEmployee3.rubricDiscount.find(
        item => item.abbr === 'INSSQ').result_equiv).to.equal(7.96);

      // Summary
      // Base Salary: $227.32
      // Net Taxable: $0.00
      // Net Non-Taxable: $0.00
      // Gross Salary: $227.32
      expect(dataEmployee3.gross_salary_equiv).to.equal(227.32);

      // IPR Base ($): 227.32 - 7.96 = $219.36
      // IPR Base (FC): 204,008 CDF
      // IPR Base Annual (FC) : 2,448,100.01 CDF
      // #### IPR Tax Band:
      // Falls within: `1,428,000 CDF – 2,700,000 CDF
      // #### Calculation:
      // Difference: `2,448,100.01 - 1,428,000 = 1,020,100.01 CDF
      // Tax: `1,020,100.01 × 0.2 = 204,020 CDF
      // Add lower bracket cumulative: `204,020 + 135,576  = 339,596 CDF
      // Monthly IPR: `339,596 / 12 = 28,299.66 CDF`
      // Converted to USD: `28,299.66 / 930 ≈ $30.43`

      expect(dataEmployee3.rubricDiscount.find(
        item => item.abbr === 'IPR').result_equiv).to.equal(30.43);

      // Total Deductions
      // Salary Advance                        | $50.00  |
      // INSS QPO (3.5%)                       | $7.96   |
      // IPR                                   | $30.43  |
      // Total Deductions                      | $88.39  |
      const totalDeduction3 = Math.round(dataEmployee3.somChargeEmployee_equiv * 100) / 100;
      expect(totalDeduction3).to.equal(88.39);
      // Net Salary Calculation
      // Gross Salary: `$227.32`
      // Deductions:   `$88.39`
      // Net Salary:   `$138.93`
      expect(dataEmployee3.net_salary_equiv).to.equal(138.93);

    } catch (err) {
      helpers.handler(err);
    }
  });

});
