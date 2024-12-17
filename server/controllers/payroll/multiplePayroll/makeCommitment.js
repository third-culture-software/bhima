/**
 *
 * @description
 * This controller makes it possible to make entries to make the payment commitment.
 *
 * @requires db
 * @requires ./find
 * @requires configurationData
 * @requires Exchange
 */

const db = require('../../../lib/db');
const configurationData = require('./find');

// Three different, mutually exclusive options for how to format commitment transactions.
// Which one to use is determined by the enterprise settings.
const { commitments } = require('./commitment');
const { groupedCommitments } = require('./groupedCommitment');
const { commitmentByEmployee } = require('./commitmentByEmployee');

const Exchange = require('../../finance/exchange');
const CostCenter = require('../../finance/cost_center');

/**
 * @function config
 *
 * @description
 * This is an HTTP interface to schedule employees for payment in th payroll module.
 * It is exposed on the URL /multiple_payroll/:id/commitment.
 *
 * Practically, this function is just a switch that reads the enterprise settings
 * and determines which underlying commitment function to call. The work of actually
 * writing data to the database is done by either the commitments, groupedCommitment,
 * or commitmentByEmployee function(s). This is because BHIMA supports three different
 * kinds of commitment functions, which affects how the transactions are represented in
 * the Posting Journal.
 *
 *  1) @TODO(jniles): figure out what commitments() does.
 *  2) groupedComitments() groups all the employee information into as few transactions as possible.
 *     In practice, this means that one voucher with multiple lines for each employee for each transaction type,
 *     such as employee benefits, pension, tax withholdings, etc.
 *       Advantages:
 *          - There are fewer transactions to audit, and may be more familiar to those coming from a
 *          paper-based system.
 *          - Less data written to the posting_journal/general_ledger.
 *        Disadvantages:
 *          - Some detail/precision is lost in the bulk transactions.
 *          - More difficult to ascertain if a given employee received all the benefits they were owed.
 *  3) commitmentsByEmployee() writes unique transactions for each employee with a detailed description for better
 *     financial tracking as compared to group transactions.  This option produces the most volument and verbose
 *     transactions.
 *         Advantages:
 *           - It is comparatively easy to determine that each employee received their full benefits.
 *           - More information is included in the descriptive text, aiding future lookups.
 *         Disadvantages:
 *           - Many more transactions are written to posting_journal, whicn mean analyzing any given transaction may
 *           lose the context of the greater payroll period.
 *
 * The default option is the "commitments" function from "./commitment".
 */
async function config(req, res, next) {
  // Collection of employee uuids to configure for payment

  // TODO(@jniles) - why is this parameter allowed to be empty?
  const employeesUuid = (req.body.data || []).map(uid => db.bid(uid));

  // This ID is passed in as a URL parameter.
  const payrollConfigurationId = req.params.id;

  const projectId = req.session.project.id;
  const userId = req.session.user.id;
  const currencyId = req.session.enterprise.currency_id;

  // TODO(@jniles) - eventually, this should be read from the user table.
  // https://github.com/Third-Culture-Software/bhima/issues/7936
  const { lang } = req.query;

  // enterprise settings switches
  // TODO(@jniles) - potentially make sure that the session is refreshed before relying on these variables
  // to prevent using stale or out of date data.
  const postingPayrollCostCenterMode = req.session.enterprise.settings.posting_payroll_cost_center_mode;
  const postingPensionFundTransactionType = req.session.enterprise.settings.pension_transaction_type_id;

  /*
    * With this request we retrieve the identifier of the configuration period,
    * the label, the account that was used for the configuration, the fiscal year and the period.
  */
  const sqlGetAccountPayroll = `
    SELECT payroll_configuration.id, payroll_configuration.label, payroll_configuration.config_accounting_id,
      payroll_configuration.dateFrom, payroll_configuration.dateTo, config_accounting.account_id,
      period.fiscal_year_id, period.id AS period_id
    FROM payroll_configuration
    JOIN config_accounting ON config_accounting.id = payroll_configuration.config_accounting_id
    JOIN period ON period.start_date <= payroll_configuration.dateTo AND period.end_date >= payroll_configuration.dateTo
    WHERE payroll_configuration.id = ?
  `;

  /*
    * The following requests to retrieve the list of Rubrics configured
    * for a payment period but also the values of the corresponding data corresponding to each employee
  */
  const sqlGetRubricConfig = `
    SELECT config_rubric_item.id AS configId, config_rubric_item.config_rubric_id,
    config_rubric_item.rubric_payroll_id, payroll_configuration.label AS PayrollConfig, rubric_payroll.*
    FROM config_rubric_item
    JOIN rubric_payroll ON rubric_payroll.id = config_rubric_item.rubric_payroll_id
    JOIN payroll_configuration ON payroll_configuration.config_rubric_id = config_rubric_item.config_rubric_id
    WHERE payroll_configuration.id = ?
    AND rubric_payroll.debtor_account_id IS NOT NULL AND rubric_payroll.expense_account_id IS NOT NULL
  `;

  /*
    * With this request, we retrieve the data configured for the payroll for each employee
    * while taking the characteristics of items
  */
  const sqlGetRubricPayroll = `
    SELECT payment.payroll_configuration_id, BUID(payment.uuid) AS uuid, payment.basic_salary, 
      BUID(payment.employee_uuid) AS employee_uuid, payment.base_taxable, payment.currency_id,
      rubric_payroll.is_employee, rubric_payroll.is_discount, rubric_payroll.label, rubric_payroll.id,
      rubric_payroll.is_tax, rubric_payroll.is_social_care,
      rubric_payroll.is_membership_fee, rubric_payroll.debtor_account_id, rubric_payroll.expense_account_id,
      rubric_payment.value, rubric_payroll.is_associated_employee, rubric_payroll.is_linked_pension_fund,
      rubric_payroll.is_linked_to_grade, employee.reference
    FROM payment
      JOIN rubric_payment ON rubric_payment.payment_uuid = payment.uuid
      JOIN rubric_payroll ON rubric_payroll.id = rubric_payment.rubric_payroll_id
      JOIN employee ON employee.uuid = payment.employee_uuid
    WHERE payment.employee_uuid IN (?) AND payment.payroll_configuration_id = ?  AND rubric_payment.value > 0
  `;

  /*
   * With this request, we break down all the expense accounts for the employer's share by cost center
   * linked to the service assigned to each employee.
  */
  const sqlCostBreakdownByCostCenter = `
    SELECT rp.payment_uuid,  SUM(rp.value) AS value_cost_center_id,
      cc.id AS cost_center_id, a_exp.id AS account_expense_id
    FROM rubric_payment AS rp
      JOIN rubric_payroll AS rb ON rb.id = rp.rubric_payroll_id
      JOIN payment AS paie ON paie.uuid = rp.payment_uuid
      JOIN employee AS emp ON emp.uuid = paie.employee_uuid
      JOIN patient AS pat ON pat.uuid = emp.patient_uuid
      LEFT JOIN service AS ser ON ser.uuid = emp.service_uuid
      LEFT JOIN service_cost_center AS s_cost ON s_cost.service_uuid = ser.uuid
      LEFT JOIN cost_center AS cc ON cc.id = s_cost.cost_center_id
      JOIN account AS a_deb ON a_deb.id = rb.debtor_account_id
      JOIN account AS a_exp ON a_exp.id = rb.expense_account_id
    WHERE rb.is_employee = 0 AND
      rb.is_discount = 1 AND
      rb.is_linked_pension_fund = 0 AND
      paie.payroll_configuration_id = ?
    GROUP BY cc.id;
  `;

  const sqlCostBreakdownCostCenterForPensionFund = `
    SELECT rp.payment_uuid,  SUM(rp.value) AS value_cost_center_id,
      cc.id AS cost_center_id, a_exp.id AS account_expense_id
    FROM rubric_payment AS rp
      JOIN rubric_payroll AS rb ON rb.id = rp.rubric_payroll_id
      JOIN payment AS paie ON paie.uuid = rp.payment_uuid
      JOIN employee AS emp ON emp.uuid = paie.employee_uuid
      JOIN patient AS pat ON pat.uuid = emp.patient_uuid
      LEFT JOIN service AS ser ON ser.uuid = emp.service_uuid
      LEFT JOIN service_cost_center AS s_cost ON s_cost.service_uuid = ser.uuid
      LEFT JOIN cost_center AS cc ON cc.id = s_cost.cost_center_id
      JOIN account AS a_deb ON a_deb.id = rb.debtor_account_id
      JOIN account AS a_exp ON a_exp.id = rb.expense_account_id
    WHERE rb.is_employee = 0 AND rb.is_discount = 1 AND
    rb.is_linked_pension_fund = 1 AND paie.payroll_configuration_id = ?
    GROUP BY cc.id;
  `;

  /*
   * With this query we try to break down the basic salaries of employees by cost center.
  */
  const sqlSalaryByCostCenter = `
    SELECT emp.code, SUM(emp.individual_salary) AS salary_service, cc.id AS cost_center_id, cc.label AS costCenterLabel
      FROM employee AS emp
    LEFT JOIN service_cost_center AS scc ON scc.service_uuid = emp.service_uuid
    LEFT JOIN cost_center AS cc ON cc.id = scc.cost_center_id
    WHERE emp.uuid IN (?)
    GROUP BY cc.id;
  `;

  const options = {
    payroll_configuration_id : payrollConfigurationId,
    employeesUuid,
  };

  try {
    const employees = await configurationData.find(options);

    const [
      rubricsEmployees, rubricsConfig, configuration,
      costBreakDown, salaryByCostCenter, exchangeRates,
      accountsCostCenter,
    ] = await Promise.all([
      db.exec(sqlGetRubricPayroll, [employeesUuid, payrollConfigurationId]), // rubricsEmployees
      db.exec(sqlGetRubricConfig, [payrollConfigurationId]), // rubricsConfig
      db.one(sqlGetAccountPayroll, [payrollConfigurationId]), // configuration
      db.exec(sqlCostBreakdownByCostCenter, [payrollConfigurationId]), // costBreakdown
      db.exec(sqlSalaryByCostCenter, [employeesUuid]), // salaryByCostCenter
      Exchange.getCurrentExchangeRateByCurrency(), // exchagneRates
      CostCenter.getAllCostCenterAccounts(), // accountsCostCenter
    ]);

    let transactions;
    const postingJournal = db.transaction();

    // configuration has the details of the payroll account configuration, dates, and label
    // we will extend it with session information to reduce the number of parameters a function
    // takes in.
    configuration.i18nKey = lang;
    configuration.currencyId = currencyId;
    configuration.userId = userId;
    configuration.projectId = projectId;
    configuration.pensionFundTransactionType = postingPensionFundTransactionType;

    switch (postingPayrollCostCenterMode) {
    case 'grouped': {

      const pensionFundCostBreakDown = await db.exec(
        sqlCostBreakdownCostCenterForPensionFund, [payrollConfigurationId],
      );

      transactions = groupedCommitments(
        employees,
        rubricsEmployees,
        rubricsConfig,
        configuration,
        exchangeRates,
        accountsCostCenter,
        costBreakDown,
        salaryByCostCenter,
        pensionFundCostBreakDown,
      );
      break;
    }
    case 'individually':
      transactions = commitmentByEmployee(
        employees,
        rubricsEmployees,
        configuration,
        projectId,
        userId,
        exchangeRates,
        currencyId,
        postingPensionFundTransactionType,
      );
      break;

    case 'default':
    default:
      transactions = commitments(
        employees,
        rubricsEmployees,
        rubricsConfig,
        configuration,
        projectId,
        userId,
        exchangeRates,
        currencyId,
        accountsCostCenter,
        postingPensionFundTransactionType,
      );

      break;
    }

    // schedule all queries for execution
    transactions.forEach(({ query, params }) => postingJournal.addQuery(query, params));

    await postingJournal.execute();

    res.sendStatus(201);
  } catch (e) {
    next(e);
  }
}

// Make commitment of payment
exports.config = config;
