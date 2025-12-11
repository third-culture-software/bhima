/* global expect, agent */
const helpers = require('../helpers');

const dataEmployees = require('./dataEmployees');
const dataEmployeesUuid = require('./dataEmployeesUuid');

describe(`Switch to the "individual transaction per employee" option`, () => {
  /* **************************************************************************************************
  * Switch to the "individual transaction per employee" option.
  * The following tests will trigger payroll transactions processed separately for each employee.
  * With this option, each employee's salary payment is recorded as an individual transaction
  * in the accounting journal to ensure accurate tracking and validation.
  ************************************************************************************************** */
  it('should set Individually per employee mode for posting payroll', async () => {
    const defaultEnterpriseId = 1;
    const restorePayload = { settings : { posting_payroll_cost_center_mode : 'individually' } };

    const restoreRes = await agent
      .put(`/enterprises/${defaultEnterpriseId}`)
      .send(restorePayload);

    expect(restoreRes).to.have.status(200);
    expect(restoreRes.body.settings.posting_payroll_cost_center_mode).to.equal('individually');
  });
});

describe(`Tests verifies the generation, recording,
  and integrity of payroll commitments in BHIMA covering individual`, () => {

  /**
  * Payroll Period Setup for Individual Employee Integration Test
  * To validate the individual posting mode in the payroll module,
  * a specific payroll period is created for a single employee.
  * This period represents the configuration of how payroll data is posted
  * into the accounting journal and assigned to the relevant cost center for that employee.
  * It is used to ensure that the individual posting type is correctly processed,
  * recorded, and reconciled during integration testing.
  */
  let payrollConfigMay2025Id;

  // Commitment – Justification for the total number of transactions
  // The value `numberTransactions = 51` is obtained as follows:
  // - 17 commitment transactions, corresponding to the 17 employees configured for the period
  // - 17 employee withholding transactions
  // - 17 social charges on remuneration transactions
  const numberPayrollTransactions = 51;

  it('Default Payroll Setting - Global Posting', async () => {
    try {

      const payrollConfigMay2025 = {
        label : 'PERIOD ONE TRANSACTION PER EMPLOYEE - MAY 2025',
        dateFrom : '2025-05-01',
        dateTo : '2025-05-31',
        config_employee_id : 14,
        config_rubric_id : 6,
        config_accounting_id : 1,
        config_weekend_id : 1,
        config_ipr_id : 1,
      };

      const resOneTransaction = await agent.post('/payroll_config').send(payrollConfigMay2025);
      expect(resOneTransaction).to.have.status(201);
      payrollConfigMay2025Id = resOneTransaction.body.id;
    } catch (err) {
      helpers.handler(err);
    }
  });

  it(`POST /multiple_payroll/:id/(multi)configuration for Employees Payment`, async () => {
    const employees = dataEmployees;

    const dataMultiConfiguration = {
      data : {
        employees,
        currencyId : 2,
      },
    };

    try {
      const resPostOneTransaction = await agent
        .post(`/multiple_payroll/${payrollConfigMay2025Id}/multiConfiguration`)
        .send(dataMultiConfiguration);
      // Check that the POST request was successful
      expect(resPostOneTransaction).to.have.status(201);

    } catch (err) {
      helpers.handler(err);
    }
  });

  /* ============================================================
    = INDIVIDUALLY PER EMPLOYEE PAYROLL COMMITMENT LOGIC (BHIMA)
    ============================================================

    This section explains how payroll commitment transactions
    are recorded in the accounting journal when using the Individually per employee parameter.

    The system processes three transactions for each employee:
    1️ Payment Commitment
    2️ Employer Social Charges
    3️ Employee Payment Retentions

    The total number of transactions will be equal to the number of configured employees multiplied by three.
  */

  /* ------------------------------------------------------------
    1️. PAYMENT COMMITMENT (PER EMPLOYEE)
    ------------------------------------------------------------
    Transaction Category: **PAYROLL_COMMITMENT**
    ------------------------------------------------------------

    In this first category of transaction, the system records
    the payroll expense associated with a single employee.

    The configured EXPENSE ACCOUNT (from the account settings)
    is DEBITED with the full gross remuneration of the employee.

    The corresponding CREDIT entry is posted to the EMPLOYEE
    CREDITOR ACCOUNT linked to this specific employee. The employee’s
    unique identifier is stored to ensure that the commitment is
    associated with the correct individual.

    + Debit: Expense Account (company payroll cost)
    - Credit: Employee Creditor Account (amount owed to the employee)
  */

  /* ------------------------------------------------------------
    2️. EMPLOYER SOCIAL CHARGES (PER EMPLOYEE)
    ------------------------------------------------------------
    Transaction Category: **EMPLOYER_SOCIAL_CHARGES**
    ------------------------------------------------------------

    In this second category of transaction, the system records
    the employer-borne social contributions for the individual
    employee.

    Each contribution type (e.g., social security, pension,
    insurance) is mapped to a THIRD-PARTY ACCOUNT and a CHARGE ACCOUNT.

    For the employee currently being processed, the system computes
    the employer’s contribution amounts and posts:

    + Debit: Employer Charge Accounts (per contribution type)
    - Credit: Third-Party Accounts (social institutions)

    This category ensures that employer-side social costs are tracked
    separately for every employee.
  */
  /* ------------------------------------------------------------
    3️. EMPLOYEE PAYMENT RETENTIONS (PER EMPLOYEE)
    ------------------------------------------------------------
    Transaction Category: **EMPLOYEE_DEDUCTIONS**
    ------------------------------------------------------------

    In this third category of transaction, the system records
    all deductions applied to the employee—such as taxes,
    employee contributions, and other withholdings.

    For the employee being processed, each deduction item is
    computed and recorded individually.

    The DEDUCTION ACCOUNTS are CREDITED,
    while the SALARY PAYABLE ACCOUNT is DEBITED to adjust
    the initial commitment posted in the first category.

    + Debit: Salary Payable Account
    - Credit: Deduction Accounts (employee-side charges)

    This category ensures that the employee's NET SALARY reflects
    the accurate payable amount after all deductions.
  */
  it(`POST /multiple_payroll/:id/commitment should Set Configuration of Payment
    with individually per employee`, async () => {
    const dataCommitment = {
      data : dataEmployeesUuid,
    };

    try {
      const commitmentByEmployee = await agent
        .post(`/multiple_payroll/${payrollConfigMay2025Id}/commitment`)
        .send(dataCommitment);

      // Check that the POST request was successful
      expect(commitmentByEmployee).to.have.status(201);

    } catch (err) {
      helpers.handler(err);
    }
  });

  it('should restore default posting payroll', async () => {
    const defaultEnterpriseId = 1;
    const restorePayload = { settings : { posting_payroll_cost_center_mode : 'default' } };

    const restoreRes = await agent
      .put(`/enterprises/${defaultEnterpriseId}`)
      .send(restorePayload);

    expect(restoreRes).to.have.status(200);
    expect(restoreRes.body.settings.posting_payroll_cost_center_mode).to.equal('default');
  });

  it(`This test verifies that payroll data and accounting transactions generated,
    with the option "individual transaction per employee" are consistent and correctly balanced.`, async () => {

    // Retrieve the data generated for the selected payroll period.
    const payrollConfigMay2025 = {
      currency : 2,
      employees : dataEmployeesUuid,
      idPeriod : payrollConfigMay2025Id,
      lang : 'fr',
      payslip : 'true',
      renderer : 'json',
    };

    const commitmentTypeId = 15;
    const withHoldingTypeId = 16;
    const socialChargeTypeId = 17;

    try {
      const payslip = await agent
        .get('/reports/payroll/payslip')
        .query(payrollConfigMay2025);

      // Verify that the employee "ALICE MARTIN ROUSSEAU" is present in the data

      // Filter for the specific employee by display_name
      const employeePayslip = payslip.body.dataEmployees.find(emp => emp.display_name === 'ALICE MARTIN ROUSSEAU');

      expect(
        employeePayslip.display_name,
        'The employeePayslip does not match the expected display_name \'ALICE MARTIN ROUSSEAU\'',
      ).to.equal('ALICE MARTIN ROUSSEAU');

      // Gross Salary: $841.88
      /** social charges:
       * - INSSP : $36.47
       * - ONEM  : $1.46
       * - INPP  : $14.59
       * Total social charges: $52.52
       * ----------------------
       * taxes withheld:
       * - INSSQ : $25.53
       * - IPR $148.79
       * Total taxes withheld: $174.32
      */
      // taxes withheld

      // should have the correct gross salary
      expect(employeePayslip.gross_salary_equiv).to.equal(841.88);

      // should have correct social charges
      expect(employeePayslip.rubricsChargeEnterprise.find(
        item => item.abbr === 'INSSP').result_equiv).to.equal(36.47);

      expect(employeePayslip.rubricsChargeEnterprise.find(
        item => item.abbr === 'ONEM').result_equiv).to.equal(1.46);

      expect(employeePayslip.rubricsChargeEnterprise.find(
        item => item.abbr === 'INPP').result_equiv).to.equal(14.59);

      expect((Number(employeePayslip.somChargeEnterprise_equiv.toFixed(2)))).to.equal(52.52);

      // should have correct taxes withheld
      expect(employeePayslip.rubricsChargeEmployee.find(
        item => item.abbr === 'INSSQ').result_equiv).to.equal(25.53);

      expect(employeePayslip.rubricsChargeEmployee.find(
        item => item.abbr === 'IPR').result_equiv).to.equal(148.79);

      expect((Number(employeePayslip.somChargeEmployee_equiv.toFixed(2)))).to.equal(174.32);

      // Compute the total gross salary for all employees in the payroll period
      const totalGrossSalary = payslip.body.dataEmployees.reduce(
        (sum, item) => sum + (item.gross_salary_equiv || 0), 0);

      // Compute the total amount of payroll deductions borne by employees, based on deduction rubrics
      const totalChargeEmployee = payslip.body.dataEmployees.reduce(
        (sum, item) => sum + (item.somChargeEmployee || 0), 0);

      const totalSocialCharge = payslip.body.dataEmployees.reduce(
        (sum, item) => sum + (item.somChargeEnterprise || 0), 0);

      /*
      * Retrieve the expense accounts associated with payroll commitment rubrics.
      * These represent benefit-type items (is_discount = 0) linked to company expenses.
      * Each rubric includes an expense_account_id, meaning it contributes to the
      * debit side of payroll commitment transactions recorded in the journal.
      */
      const rubricAdventages = [
        ...new Set(
          payslip.body.rubrics
            .filter(item => item.is_discount === 0 && item.expense_account_id),
        ),
      ];

      const accountRubricAdventages = [
        ...new Set(
          payslip.body.rubrics
            .filter(item => item.is_discount === 0 && item.debtor_account_id)
            .map(item => item.debtor_account_id),
        ),
      ];

      /*
      * Retrieve the accounts linked to salary deduction rubrics.
      * These are employee-borne items (is_discount = 1) that include a debtor_account_id.
      * They represent payroll deductions such as taxes or social contributions,
      * and are credited in the journal as part of employee-side charges.
      */
      const accountRubricWithHolding = [
        ...new Set(
          payslip.body.rubrics
            .filter(item => item.is_discount === 1 && item.debtor_account_id && item.is_employee)
            .map(item => item.debtor_account_id),
        ),
      ];

      const rubricWithholdings = [
        ...new Set(
          payslip.body.rubrics
            .filter(item => item.is_discount === 1 && item.debtor_account_id && item.is_employee),
        ),
      ];

      /*
      * Retrieve the accounts linked to employer social charge rubrics.
      * These are company-borne items (is_discount = 1) that include an expense_account_id.
      * They represent employer contributions such as pension, insurance, or social security,
      * and are recorded as company expenses in the payroll commitment transactions.
      */
      const accountRubricSocialCharge = [
        ...new Set(
          payslip.body.rubEnterprises
            .filter(item => item.is_discount === 1 && item.debtor_account_id && item.is_employee === 0)
            .map(item => item.debtor_account_id),
        ),
      ];

      const rubricSocialCharge = [
        ...new Set(
          payslip.body.rubEnterprises
            .filter(item => item.is_discount === 1 && item.debtor_account_id && item.is_employee === 0),
        ),
      ];

      // Check that the POST request was successful
      expect(payslip).to.have.status(200);

      const queryByEmployeePeriod = {
        aggregates : 1,
        description : 'in payment period 05-2025',
        limit : '1000000',
        period : 'custom',
        custom_period_end : '2025-05-31',
        custom_period_start : '2025-05-01',
        showFullTransactions : 1,
      };

      const dataPostingJournalDefault = await agent
        .get('/journal')
        .query(queryByEmployeePeriod);

      /*
      * Group transactions by their unique transaction ID
      * to analyze and validate each payroll commitment entry individually.
      */
      const uniqueTransIds = new Set(dataPostingJournalDefault.body.map(item => item.trans_id));

      expect(uniqueTransIds.size).to.equal(numberPayrollTransactions);

      /*
      * Verify that for each employee, three transactions are generated:
      * 1. Payroll Commitment
      * 2. Employee Withholdings
      * 3. Employer Social Charges
      *
      * The total number of transactions should therefore equal three multiplied
      * by the number of employees processed.
      */
      const numberTransactions = dataEmployeesUuid.length * 3;
      expect(uniqueTransIds.size).to.equal(numberTransactions);

      /*
      * Verify that each transaction contains at most one employee.
      * This ensures that the "by employee" posting mode is respected,
      * i.e., a single transaction should not include more than one employee.
      */
      // Group journal lines by trans_id
      const transactionsGrouped = {};

      // Iterate over the journal
      dataPostingJournalDefault.body.forEach(line => {
        if (!transactionsGrouped[line.trans_id]) {
          transactionsGrouped[line.trans_id] = new Set();
        }
        if (line.entity_uuid) {
          transactionsGrouped[line.trans_id].add(line.entity_uuid);
        }
      });

      // Test: each trans_id must contain **0 or 1** entity_uuid
      Object.entries(transactionsGrouped).forEach(([transId, entitySet]) => {
        // Verify that there are at most one entity_uuid
        expect(
          entitySet.size,
          `Transaction ${transId} contains more than one employee`,
        ).to.be.at.most(1);
      });

      /*
      * Analyze payroll commitment transactions and verify that:
      * each transaction is correctly recorded, balanced, and aligns with the expected payroll totals.
      */
      const commitmentTransactions = dataPostingJournalDefault.body.filter(
        item => item.transaction_type_id === commitmentTypeId);
      const totalDebitCommitment = commitmentTransactions.reduce((sum, item) => sum + (item.debit_equiv || 0), 0);
      const totalCreditCommitment = commitmentTransactions.reduce((sum, item) => sum + (item.credit_equiv || 0), 0);

      /*
      * Verify that the transaction is balanced,
      * ensuring that the total debits equal the total credits.
      */
      expect(Number(totalDebitCommitment.toFixed(2)),
        'The commitment transaction is not balanced: total debits do not match total credits')
        .to.equal(Number(totalCreditCommitment.toFixed(2)));

      /*
      * Verify that the total debits of the payroll commitment transaction
      * match the aggregated gross salaries (totalGrossSalary) from the payroll report.
      */
      expect(
        Number(totalDebitCommitment.toFixed(2)),
        'Total debit of the payroll commitment does not match the aggregated gross salaries',
      ).to.equal(Number(totalGrossSalary.toFixed(2)));

      const accountCommitmentTransactions = commitmentTransactions.filter(
        item => item.transaction_type_id === commitmentTypeId && item.debit_equiv > 0);

      /*
      * Retrieve the account IDs of rubrics configured as company commitments
      * to employees, representing amounts the company owes to each employee.
      */
      accountRubricAdventages.forEach(elt => {
        // Filter the transactions where the following accounts have been debited.
        const totalDebitEquiv = accountCommitmentTransactions
          .filter(item => item.account_id === elt)
          .reduce((sum, item) => sum + (item.debit_equiv || 0), 0);

        /*
        * Filter the total employee benefits by rubric
        * and calculate the aggregated benefit amount for each account.
        */
        const totalRubricAdventagesByAccount = rubricAdventages
          .filter(item => item.expense_account_id === elt)
          .reduce((sum, item) => sum + (item.total || 0), 0);

        /*
        * Verify that the total debited amount matches exactly
        * the value configured in the payroll for each rubric/account.
        */
        expect(
          Number(totalDebitEquiv.toFixed(2)),
          'The total debited amount does not match the configured value for the rubric/account',
        ).to.equal(Number(totalRubricAdventagesByAccount.toFixed(2)));
      });

      /* *****************************************************
      * Analyze transactions related to employee salary deductions (Withholding Type)
      ***************************************************** */
      const withHoldingTransactions = dataPostingJournalDefault.body.filter(
        item => item.transaction_type_id === withHoldingTypeId);

      const totalDebitWithHolding = withHoldingTransactions.reduce((sum, item) => sum + (item.debit_equiv || 0), 0);
      const totalCreditWithHolding = withHoldingTransactions.reduce((sum, item) => sum + (item.credit_equiv || 0), 0);

      /*
      * Verify that the transaction is balanced,
      * ensuring that total debits equal total credits.
      */
      expect(
        Number(totalDebitWithHolding.toFixed(2)),
        'The withholding transaction is not balanced: total debits do not match total credits',
      ).to.equal(Number(totalCreditWithHolding.toFixed(2)));

      // Ensure that the total credits match the total employee deductions.
      expect(
        Number(totalCreditWithHolding.toFixed(2)),
        'Total credits for withholdings do not match the total employee deductions',
      ).to.equal(Number(totalChargeEmployee.toFixed(2)));

      const accountWithHoldingTransactions = withHoldingTransactions.filter(
        item => item.transaction_type_id === withHoldingTypeId && item.credit_equiv > 0);

      /*
      * Retrieve the account IDs of rubrics configured as employee salary deductions.
      */
      accountRubricWithHolding.forEach(elt => {
        // Filter the transactions where the following accounts have been credited.
        const totalCreditEquiv = accountWithHoldingTransactions
          .filter(item => item.account_id === elt)
          .reduce((sum, item) => sum + (item.credit_equiv || 0), 0);

        /*
        * Filter employee deductions by rubric
        * and calculate the total deduction amount for each account.
        */
        const totalRubricWithHoldingByAccount = rubricWithholdings
          .filter(item => item.debtor_account_id === elt)
          .reduce((sum, item) => sum + (item.total || 0), 0);

        /*
        * Verify that the total credited amount matches exactly
        * the value configured in the payroll for each deduction rubric.
        */
        expect(
          Number(totalCreditEquiv.toFixed(2)),
          'The total credited amount does not match the configured value for the deduction rubric/account',
        ).to.equal(Number(totalRubricWithHoldingByAccount.toFixed(2)));
      });

      /* *****************************************************
      * Analyze transactions related to employer social charges on payroll.
      ***************************************************** */
      const socialChargeTransactions = dataPostingJournalDefault.body.filter(
        item => item.transaction_type_id === socialChargeTypeId);

      const totalDebitSocialCharge = socialChargeTransactions.reduce((sum, item) => sum + (item.debit_equiv || 0), 0);
      const totalCreditSocialCharge = socialChargeTransactions.reduce((sum, item) => sum + (item.credit_equiv || 0), 0);

      /*
      * Verify that the employer social charge transaction is balanced,
      * confirming that the total debits equal the total credits.
      */
      expect(
        Number(totalDebitSocialCharge.toFixed(2)),
        'The employer social charge transaction is not balanced: total debits do not match total credits',
      ).to.equal(Number(totalCreditSocialCharge.toFixed(2)));

      /*
      * Ensure that the total credits correspond to the total employer social charges.
      */
      expect(
        Number(totalCreditSocialCharge.toFixed(2)),
        'Total credits for employer social charges do not match the expected total social charges',
      ).to.equal(Number(totalSocialCharge.toFixed(2)));

      const accountSocialChargeTransactions = socialChargeTransactions.filter(
        item => item.transaction_type_id === socialChargeTypeId && item.credit_equiv > 0);

      /*
      * Retrieve the account IDs of rubrics configured as employer social charges.
      */
      accountRubricSocialCharge.forEach(elt => {
        // Filter the transactions where the following accounts have been credited
        // and sum the credited amounts for each account.
        const totalCreditEquiv = accountSocialChargeTransactions
          .filter(item => item.account_id === elt)
          .reduce((sum, item) => sum + (item.credit_equiv || 0), 0);

        /*
        * Filter employer social charge rubrics
        * and calculate the total credited amount for each account.
        */
        const totalRubricSocialChargeByAccount = rubricSocialCharge
          .filter(item => item.debtor_account_id === elt)
          .reduce((sum, item) => sum + (item.total || 0), 0);

        /*
        * Verify that the total credited amount matches exactly
        * the value configured in the payroll for each employer social charge rubric.
        */
        expect(
          Number(totalCreditEquiv.toFixed(2)),
          'The total credited amount does not match the configured value for the employer social charge rubric/account',
        ).to.equal(Number(totalRubricSocialChargeByAccount.toFixed(2)));
      });

    } catch (err) {
      helpers.handler(err);
    }
  });

});
