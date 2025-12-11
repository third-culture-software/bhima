/* global expect, agent */
const helpers = require('../helpers');

const dataEmployees = require('./dataEmployees');
const dataEmployeesUuid = require('./dataEmployeesUuid');

describe(`Tests verifies the generation, recording, and integrity of payroll commitments in BHIMA,
   covering default`, () => {

  /**
   * Payroll Periods Setup for Integration Tests
   * Defines a single payroll period using the default posting mode.
   * This period serves to validate that payroll data is correctly posted,
   * recorded, and reconciled in the accounting journal under default settings.
   */
  let payrollConfigMarch2025Id;

  const payrollConfigMarch2025Label = 'PERIOD DEFAULT PAYROLL SETTING - MARCH 2025';

  it('Default Payroll Setting - Global Posting', async () => {
    try {
      const payrollConfigMarch2025 = {
        label : payrollConfigMarch2025Label,
        dateFrom : '2025-03-01',
        dateTo : '2025-03-31',
        config_employee_id : 14,
        config_rubric_id : 6,
        config_accounting_id : 1,
        config_weekend_id : 1,
        config_ipr_id : 1,
      };

      const resDefault = await agent.post('/payroll_config').send(payrollConfigMarch2025);
      expect(resDefault).to.have.status(201);
      payrollConfigMarch2025Id = resDefault.body.id;

    } catch (err) {
      helpers.handler(err);
    }
  });

  it(`POST /multiple_payroll/:id/multiConfiguration for Employees Payment`, async () => {
    const employees = dataEmployees;

    const dataMultiConfiguration = {
      data : {
        employees,
        currencyId : 2,
      },
    };

    try {
      const resPostDefault = await agent
        .post(`/multiple_payroll/${payrollConfigMarch2025Id}/multiConfiguration`)
        .send(dataMultiConfiguration);

      // Check that the POST request was successful
      expect(resPostDefault).to.have.status(201);
    } catch (err) {
      helpers.handler(err);
    }
  });

  /* ============================================================
    = DEFAULT PAYROLL COMMITMENT LOGIC (BHIMA)
    ============================================================

    This section explains how payroll commitment transactions
    are recorded in the accounting journal when using the default parameter.

    The system automatically generates THREE TRANSACTIONS:
    1️ Payment Commitment
    2️ Employer Social Charges
    3️ Employee Payment Retentions
  */

  /* ------------------------------------------------------------
    1️ PAYMENT COMMITMENT
    ------------------------------------------------------------

    In this first transaction, the system records the total payroll expense.

    The configured EXPENSE ACCOUNT (from account settings)
    is DEBITED with the total amount representing all employee benefits.

    The corresponding CREDIT entry is made to each EMPLOYEE CREDITOR ACCOUNT,
    and the employee’s unique identifier is attached to link
    the institution’s commitment to pay that specific employee.

    + Debit: Expense Account (company charge)
    - Credit: Employee Creditor Account

    Note:
    Under this default option, all company expenses are grouped
    rather than split by individual employee.
  */

  /* ------------------------------------------------------------
    2️ EMPLOYER SOCIAL CHARGES ON REMUNERATION
    ------------------------------------------------------------

    The second transaction summarizes all social contributions
    that are borne by the employer.

    Each contribution type (e.g., social security, pension, insurance)
    has both a THIRD-PARTY ACCOUNT and a CHARGE ACCOUNT.

    The system computes the total amount for all employees and records:
    + Debit: Employer Charge Accounts (by contribution type)
    - Credit: Third-Party Accounts (social institutions)

    This transaction consolidates all employer-borne expenses
    related to employee remuneration.
  */

  /* ------------------------------------------------------------
    3️ EMPLOYEE PAYMENT RETENTIONS (DEDUCTIONS)
    ------------------------------------------------------------

    The third transaction records all deductions
    that are borne by the employees themselves.

    For each employee, the system determines all deduction items
    (such as taxes, social contributions, or other withholdings).

    These DEDUCTION ACCOUNTS are CREDITED,
    while the SALARY PAYABLE ACCOUNT is DEBITED
    to reduce the total amount recorded during the payroll commitment.

    + Debit: Salary Payable Account
    - Credit: Deduction Accounts (employee-side charges)

    This ensures that the NET SALARY corresponds
    to the actual payable amount after all deductions.
  */
  it(`POST /multiple_payroll/:id/commitment should Set Configuration of Payment with default option`, async () => {
    const dataCommitment = {
      data : dataEmployeesUuid,
    };

    try {
      const commitmentDefault = await agent
        .post(`/multiple_payroll/${payrollConfigMarch2025Id}/commitment`)
        .send(dataCommitment);
      // Check that the POST request was successful
      expect(commitmentDefault).to.have.status(201);

    } catch (err) {
      helpers.handler(err);
    }
  });

  // Here, we will perform a comparative analysis between the data configured in the payroll
  // and the accounting transactions generated by the payroll using the default option.
  // The test begins by selecting the data retrieved from the payroll report.
  it(`This test verifies that payroll data and accounting transactions generated,
    with the default (global) posting option are consistent and correctly balanced.`, async () => {
    // Retrieve the data generated for the selected payroll period.
    const paramsConfigMarch2025 = {
      currency : 2,
      employees : dataEmployeesUuid,
      idPeriod : payrollConfigMarch2025Id,
      lang : 'fr',
      payslip : true,
      renderer : 'json',
    };

    const commitmentTypeId = 15;
    const withHoldingTypeId = 16;
    const socialChargeTypeId = 17;

    try {
      const payslip = await agent
        .get('/reports/payroll/payslip')
        .query(paramsConfigMarch2025);

      // Verify that the employee "ANDREW BELL COOPER" is present in the data

      // Filter for the specific employee by display_name
      const employeePayslip = payslip.body.dataEmployees.find(emp => emp.display_name === 'ANDREW BELL COOPER');

      expect(employeePayslip.display_name,
        'The employeePayslip does not match the expected display_name \'ANDREW BELL COOPER\'',
      ).to.equal('ANDREW BELL COOPER');

      // Gross Salary: $579.38
      /** social charges:
       * - INSSP : $23.34
       * - ONEM  : $0.93
       * - INPP  : $9.34
       * Total social charges: $33.61
       * ----------------------
       * taxes withheld:
       * - INSSQ : $16.34
       * - IPR $82.79
       * Total taxes withheld: $99.13
      */
      // taxes withheld

      // should have the correct gross salary
      expect(employeePayslip.gross_salary_equiv,
        'The gross salary of the employeePayslip does not match the expected value 579.38').to.equal(579.38);

      // should have correct social charges
      expect(
        employeePayslip.rubricsChargeEnterprise.find(item => item.abbr === 'INSSP').result_equiv,
        'The INSSP charge of the employeePayslip does not match the expected value 23.34',
      ).to.equal(23.34);

      expect(
        employeePayslip.rubricsChargeEnterprise.find(item => item.abbr === 'ONEM').result_equiv,
        'The ONEM charge of the employeePayslip does not match the expected value 0.93',
      ).to.equal(0.93);

      expect(
        employeePayslip.rubricsChargeEnterprise.find(item => item.abbr === 'INPP').result_equiv,
        'The INPP charge of the employeePayslip does not match the expected value 9.34',
      ).to.equal(9.34);

      expect(
        employeePayslip.somChargeEnterprise_equiv,
        `The total enterprise charges (somChargeEnterprise_equiv)
        of the employeePayslip does not match the expected value 33.61`,
      ).to.equal(33.61);

      // should have correct taxes withheld
      expect(
        employeePayslip.rubricsChargeEmployee.find(item => item.abbr === 'INSSQ').result_equiv,
        'The INSSQ charge of the employeePayslip does not match the expected value 16.34',
      ).to.equal(16.34);

      expect(
        employeePayslip.rubricsChargeEmployee.find(item => item.abbr === 'IPR').result_equiv,
        'The IPR charge of the employeePayslip does not match the expected value 82.79',
      ).to.equal(82.79);

      expect(
        Number(employeePayslip.somChargeEmployee_equiv.toFixed(2)),
        `The total employee charges (somChargeEmployee_equiv) of the employeePayslip does not match
        the expected value 99.13`,
      ).to.equal(99.13);

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

      const queryDefaultPeriod = {
        aggregates : 1,
        description : payrollConfigMarch2025Label,
        limit : 1000,
        period : 'custom',
        custom_period_end : '2025-03-31',
        custom_period_start : '2025-03-01',
        showFullTransactions : 1,
      };

      const dataPostingJournalDefault = await agent
        .get('/journal')
        .query(queryDefaultPeriod);

      /*
      * Group transactions by their unique transaction ID
      * to analyze and validate each payroll commitment entry individually.
      */
      const uniqueTransIds = [...new Set(dataPostingJournalDefault.body.map(item => item.trans_id))];

      /*
      * Verify that the number of generated transactions equals three,
      * corresponding to Payroll Commitment, Employee Withholdings, and Employer Social Charges.
      */
      expect(uniqueTransIds.length).to.equal(3);

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
      expect(
        Number(totalDebitCommitment.toFixed(2)),
        'The transaction is not balanced: totalDebitCommitment does not equal totalCreditCommitment',
      ).to.equal(Number(totalCreditCommitment.toFixed(2)));

      /*
      * Verify that the total debits of the payroll commitment transaction
      * match the aggregated gross salaries (totalGrossSalary) from the payroll report.
      */
      expect(
        Number(totalDebitCommitment.toFixed(2)),
        `The total debits of the payroll commitment transaction do not match
        the aggregated gross salaries (totalGrossSalary) from the payroll report`,
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
          'The total debited amount does not match the value configured in the payroll for each rubric/account',
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
        'The transaction is not balanced: totalDebitWithHolding does not equal totalCreditWithHolding',
      ).to.equal(Number(totalCreditWithHolding.toFixed(2)));

      // Ensure that the total credits match the total employee deductions.
      expect(
        Number(totalCreditWithHolding.toFixed(2)),
        'The total credits do not match the total employee deductions (totalChargeEmployee)',
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
          'The total credited amount does not match the value configured in the payroll for each deduction rubric',
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
        `The employer social charge transaction is not balanced: totalDebitSocialCharge does not equal
        totalCreditSocialCharge`,
      ).to.equal(Number(totalCreditSocialCharge.toFixed(2)));

      /*
      * Ensure that the total credits correspond to the total employer social charges.
      */
      expect(
        Number(totalCreditSocialCharge.toFixed(2)),
        'The total credits do not correspond to the total employer social charges (totalSocialCharge)',
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
          `The total credited amount does not match the value configured
          in the payroll for each employer social charge rubric`,
        ).to.equal(Number(totalRubricSocialChargeByAccount.toFixed(2)));
      });

    } catch (err) {
      helpers.handler(err);
    }
  });
});
