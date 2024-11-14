/**
 *
 * @description
 * This controller allows to initialize the payment configuration of several employees at a time,
 * the data are calculated including the values of the rubrics defined individually by employees
 *
 * @requires db
 * @requires Exchange
 * @requires payrollSettings
 */

const db = require('../../../lib/db');
const Exchange = require('../../finance/exchange');
const payrollSettings = require('./payrollSettings');

function config(req, res, next) {
  const { employees, currencyId } = req.body.data;

  const payrollConfigurationId = req.params.id;
  const enterpriseId = req.session.enterprise.id;
  const enterpriseCurrencyId = req.session.enterprise.currency_id;
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
    WHERE payroll_configuration.id = ?  AND (rubric_payroll.debtor_account_id IS NOT NULL)
    AND (rubric_payroll.expense_account_id IS NOT NULL);
  `;
  const queries = Promise.all([
    db.exec(getPeriodData, [payrollConfigurationId]),
    db.exec(getRubricPayroll, [payrollConfigurationId]),
    Exchange.getExchangeRate(enterpriseId, currencyId, new Date()),
  ]);

  queries.then(rows => {
    return payrollSettings.setConfig(
      employees,
      rows,
      enterpriseId,
      currencyId,
      enterpriseCurrencyId,
      payrollConfigurationId,
    );
  })
    .then((results) => {
      const postingJournal = db.transaction();
      results.forEach(transac => {
        transac.forEach(item => {
          postingJournal.addQuery(item.query, item.params);
        });
      });

      return postingJournal.execute();
    })
    .then(() => {
      res.sendStatus(201);
    })
    .catch(next);
}
// set Multi Configuration
exports.config = config;
