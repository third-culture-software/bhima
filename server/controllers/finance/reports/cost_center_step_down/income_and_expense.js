const _ = require('lodash');
const db = require('../../../../lib/db');
const ReportManager = require('../../../../lib/ReportManager');
const currencies = require('../../currencies');

const TEMPLATE_ACCOUNTS = './server/controllers/finance/reports/cost_center_step_down/income_and_expense.handlebars';

// expose to the API
exports.report = incomeAndExpenseReport;

/**
 * @function reporting
 *
 * @description
 * Renders the cost center value by accounts report
 *
 * @param {*} options the report options
 * @param {*} session the session
 */
async function buildAccountsReport(params, session) {
  const options = _.extend(params, {
    filename : 'COST_CENTER.REPORT.COST_CENTER_INCOME_AND_EXPENSE',
    csvKey : 'rows',
    user : session.user,
  });

  const report = new ReportManager(TEMPLATE_ACCOUNTS, session, options);

  // get exchange information for multi currency report
  const exchangeInformation = await currencies.getExchangeInformationForReports(session, params);

  const {
    dateFrom,
    dateTo,
    enterpriseId,
    firstCurrency,
    secondCurrency,
    lastRateUsed,
  } = exchangeInformation;

  const queryTotals = `
    SELECT
      z.label,
      SUM(z.income * IFNULL(GetExchangeRate(?, ?, ?), 1)) income,
      SUM(z.expense * IFNULL(GetExchangeRate(?, ?, ?), 1)) expense,
      SUM((z.income - expense) * IFNULL(GetExchangeRate(?, ?, ?), 1)) AS balance
    FROM
    (
      SELECT
        cc.label,
        SUM(IF(a.type_id = 4, gl.credit_equiv - gl.debit_equiv, 0)) AS income,
        SUM(IF(a.type_id = 5, gl.debit_equiv - gl.credit_equiv, 0)) AS expense,
        gl.cost_center_id AS ccId
      FROM general_ledger gl
      JOIN cost_center cc ON cc.id = gl.cost_center_id
      JOIN account a ON a.id = gl.account_id
      WHERE gl.period_id >= ? AND gl.period_id <= ?
      GROUP BY cc.id
    )z
  `;

  const query = `
    ${queryTotals} GROUP BY z.ccId ORDER BY z.label;
  `;

  const getExchangeRateParams = [enterpriseId, options.currency_id, dateTo];
  const glQueryParams = [options.periodFrom, options.periodTo];

  const parameters = [
    ...getExchangeRateParams,
    ...getExchangeRateParams,
    ...getExchangeRateParams,
    ...glQueryParams,
    ...glQueryParams,
  ];

  const data = await db.exec(query, parameters);
  const totals = await db.exec(queryTotals, parameters);

  const context = {
    currencyId : Number(options.currency_id),
    dateFromMonth : dateFrom,
    dateToMonth : dateTo,
    data,
    totals,
    firstCurrency,
    secondCurrency,
    lastRateUsed,
  };

  return report.render(context);
}

async function incomeAndExpenseReport(req, res) {
  const result = await buildAccountsReport(req.query, req.session);
  res.set(result.headers).send(result.report);
}
