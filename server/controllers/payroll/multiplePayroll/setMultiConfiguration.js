/**
 * @description
 * This controller initializes the payment configuration for multiple employees simultaneously. It calculates
 * the necessary data, including the values of the rubrics defined individually for each employee.
 *
 * @requires debug
 * @requires db
 * @requires Exchange
 * @requires payrollSettings
 */

const debug = require('debug')('payroll:setMultiConfiguration');
const db = require('../../../lib/db');
const Exchange = require('../../finance/exchange');
const payrollSettings = require('./payrollSettings');

async function config(req, res, next) {
  const { employees, currencyId } = req.body.data;

  const payrollConfigurationId = req.params.id;
  const enterpriseId = req.session.enterprise.id;
  const enterpriseCurrencyId = req.session.enterprise.currency_id;

  debug(`Creating a configuration for ${employees.length} employees with payroll id (${payrollConfigurationId}).`);

  // retrieves the date and currency information for the payment period
  const getPeriodData = `
    SELECT payroll_configuration.id, payroll_configuration.dateFrom, payroll_configuration.dateTo,
      payroll_configuration.config_ipr_id, taxe_ipr.currency_id
    FROM payroll_configuration
      LEFT JOIN taxe_ipr ON taxe_ipr.id = payroll_configuration.config_ipr_id
    WHERE payroll_configuration.id = ?;
  `;

  const getRubricPayroll = `
    SELECT config_rubric_item.id, config_rubric_item.config_rubric_id, config_rubric_item.rubric_payroll_id,
    payroll_configuration.label AS PayrollConfig, rubric_payroll.*
    FROM config_rubric_item
      JOIN rubric_payroll ON rubric_payroll.id = config_rubric_item.rubric_payroll_id
      JOIN payroll_configuration ON payroll_configuration.config_rubric_id = config_rubric_item.config_rubric_id
    WHERE payroll_configuration.id = ? AND (rubric_payroll.debtor_account_id IS NOT NULL)
      AND (rubric_payroll.expense_account_id IS NOT NULL);
  `;

  try {
    // get preliminary data that will be used across payroll operations
    const [periodData, rubricData, exchange] = await Promise.all([
      db.one(getPeriodData, [payrollConfigurationId]),
      db.exec(getRubricPayroll, [payrollConfigurationId]),
      Exchange.getExchangeRate(enterpriseId, currencyId, new Date()),
    ]);

    const { dateFrom, dateTo } = periodData;
    debug(`Discovered payroll configuration spans from ${dateFrom} to ${dateTo}.`);

    // TODO(@jniles): rename setConfig() to a clearer name.  It is not evident what it does.
    // retrieves a list of queries that should be executed in the same transaction.
    const payrollTxns = await payrollSettings.setConfig(
      employees,
      periodData,
      rubricData,
      exchange,
      enterpriseId,
      currencyId,
      enterpriseCurrencyId,
      payrollConfigurationId,
    );

    const txn = db.transaction();

    // flatten from list of lists and add each query to the db.transaction query
    payrollTxns
      .flat()
      .forEach(({ query, params }) => { txn.addQuery(query, params); });

    // execute
    debug(`Executing payroll transactions.`);
    await txn.execute();

    debug(`Transactions executed without error.`);
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
}
// set Multi Configuration
exports.config = config;
