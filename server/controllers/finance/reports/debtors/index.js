/**
 * @overview finance/reports/debtors/index.js
 *
 * @description
 * This report displays the amounts owed by debtor groups broken down by age of
 * their debt.  The report highlights clients who have long overdue debts, so
 * that the administration can send out a recovery service to try and recover
 * the owed debt.
 *
 * The typical age categories are 0-30 days, 30-60 days, 60-90 days, and > 90
 * days.
 *
 * As usual, the reports are created with a handlebars template and shipped to
 * the client as either JSON, HTML, or PDF, depending on the renderer specified
 * in the HTTP query string.
 */

const _ = require('lodash');
const moment = require('moment');
const ReportManager = require('../../../../lib/ReportManager');
const db = require('../../../../lib/db');

// path to the template to render
const TEMPLATE = './server/controllers/finance/reports/debtors/aged.handlebars';

const DEFAULT_OPTIONS = {
  csvKey : 'debtors',
  filename : 'REPORT.AGED_DEBTORS.TITLE',
  orientation : 'landscape',
};

/**
 * @method agedDebtorReport
 *
 * @description
 * The HTTP interface which actually creates the report.
 */
function agedDebtorReport(req, res, next) {
  const qs = _.extend(req.query, DEFAULT_OPTIONS);

  const metadata = _.clone(req.session);

  let report;

  try {
    report = new ReportManager(TEMPLATE, metadata, qs);
  } catch (e) {
    next(e);
    return;
  }

  const sql = `
    SELECT end_date FROM period WHERE id = ?;
  `;

  db.one(sql, [qs.period_id])
    .then(period => {
      qs.date = period.end_date;
      qs.enterprise_id = metadata.enterprise.id;
      // fire the SQL for the report
      return queryContext(qs);
    })
    .then(data => report.render(data))
    .then(result => {
      res.set(result.headers).send(result.report);
    })
    .catch(next)
    
}

/**
 * @method queryContext
 *
 * @param {Object} params Parameters passed in to customize the report - these
 *                        are usually passed in through the query string
 * @description
 * The HTTP interface which actually creates the report.
 */
async function queryContext(params = {}) {
  const havingNonZeroValues = ' HAVING total > 0 ';
  const includeZeroes = Boolean(Number(params.zeroes));
  const useMonthGrouping = Boolean(Number(params.useMonthGrouping));

  // format the dates for MySQL escape
  const dates = _.fill(Array(5), params.date);
  const data = {};
  const currencyId = db.escape(params.currency_id);
  const enterpriseId = db.escape(params.enterprise_id);

  const fySql = `
    SELECT locked FROM fiscal_year
    WHERE ID = (SELECT previous_FISCAL_year_id from fiscal_year where id = ?)
  `;

  const previousFy = await db.one(fySql, [params.fiscal_id]);

  const groupByMonthColumns = `
    SUM(IF(MONTH(?) - MONTH(gl.trans_date) = 0, (gl.debit_equiv - gl.credit_equiv) *
      IFNULL(GetExchangeRate(${enterpriseId}, ${currencyId}, gl.trans_date), 1), 0)) AS thirty,
    SUM(IF(MONTH(?) - MONTH(gl.trans_date) = 1, (gl.debit_equiv - gl.credit_equiv) *
      IFNULL(GetExchangeRate(${enterpriseId}, ${currencyId}, gl.trans_date), 1), 0)) AS sixty,
    SUM(IF(MONTH(?) - MONTH(gl.trans_date) = 2, (gl.debit_equiv - gl.credit_equiv) *
      IFNULL(GetExchangeRate(${enterpriseId}, ${currencyId}, gl.trans_date), 1), 0)) AS ninety,
    SUM(IF(MONTH(?) - MONTH(gl.trans_date) > 2, (gl.debit_equiv - gl.credit_equiv) *
      IFNULL(GetExchangeRate(${enterpriseId}, ${currencyId}, gl.trans_date), 1), 0)) AS excess,
  `;

  const groupByRangeColumns = `
    SUM(IF(DATEDIFF(DATE(?), DATE(gl.trans_date)) BETWEEN 0 AND 29, (gl.debit_equiv - gl.credit_equiv) *
      IFNULL(GetExchangeRate(${enterpriseId}, ${currencyId}, gl.trans_date), 1), 0)) AS thirty,
    SUM(IF(DATEDIFF(DATE(?), DATE(gl.trans_date)) BETWEEN 30 AND 59, (gl.debit_equiv - gl.credit_equiv) *
      IFNULL(GetExchangeRate(${enterpriseId}, ${currencyId}, gl.trans_date), 1), 0)) AS sixty,
    SUM(IF(DATEDIFF(DATE(?), DATE(gl.trans_date)) BETWEEN 60 AND 89, (gl.debit_equiv - gl.credit_equiv) *
      IFNULL(GetExchangeRate(${enterpriseId}, ${currencyId}, gl.trans_date), 1), 0)) AS ninety,
    SUM(IF(DATEDIFF(DATE(?), DATE(gl.trans_date)) > 90, (gl.debit_equiv - gl.credit_equiv) *
      IFNULL(GetExchangeRate(${enterpriseId}, ${currencyId}, gl.trans_date), 1), 0)) AS excess,
  `;

  // switch between grouping by month and grouping by period
  const columns = useMonthGrouping
    ? groupByMonthColumns
    : groupByRangeColumns;

  // selects into columns of 30, 60, 90, and >90
  const debtorSql = `
    SELECT BUID(dg.uuid) AS id, dg.name, a.number,
      ${columns}
      SUM((gl.debit_equiv - gl.credit_equiv) *
        IFNULL(GetExchangeRate(${enterpriseId}, ${currencyId}, gl.trans_date), 1)) AS total
    FROM debtor_group AS dg JOIN debtor AS d ON dg.uuid = d.group_uuid
      LEFT JOIN general_ledger AS gl ON gl.entity_uuid = d.uuid
      JOIN account AS a ON a.id = dg.account_id
    WHERE DATE(gl.trans_date) <= DATE(?)
      AND gl.fiscal_year_id = ?
    GROUP BY dg.uuid
    ${includeZeroes ? '' : havingNonZeroValues}
    ORDER BY a.number;
  `;

  // aggregates the data above as totals into columns of 30, 60, 90, and >90
  const aggregateSql = `
    SELECT
      ${columns}
      SUM((gl.debit_equiv - gl.credit_equiv)*
      IFNULL(GetExchangeRate(${enterpriseId}, ${currencyId}, gl.trans_date), 1)) AS total
    FROM debtor_group AS dg JOIN debtor AS d ON dg.uuid = d.group_uuid
      LEFT JOIN general_ledger AS gl ON gl.entity_uuid = d.uuid
    WHERE DATE(gl.trans_date) <= DATE(?)
      AND gl.fiscal_year_id = ?
    ${includeZeroes ? '' : havingNonZeroValues}
  `;

  const debtors = await db.exec(debtorSql, [...dates, params.fiscal_id]);

  data.debtors = debtors;
  data.dateUntil = params.date;
  data.previousFyClosed = previousFy.locked;

  // this is specific to grouping by months
  data.firstMonth = params.date;
  data.secondMonth = moment(params.date).subtract(1, 'month');
  data.thirdMonth = moment(params.date).subtract(2, 'month');
  data.useMonthGrouping = useMonthGrouping;

  const [aggregates] = await db.exec(aggregateSql, [...dates, params.fiscal_id]);
  data.aggregates = aggregates;
  data.currency_id = params.currency_id;

  return data;
}

exports.context = queryContext;
exports.aged = agedDebtorReport;
exports.open = require('./openDebtors').report;
