/**
 * @file server/controllers/finance/reports/financial.employee.js
 * @description
 * This file contains code to create a PDF report for financial activities of an employee
 * @requires Employee
 * @requires ReportManager
 */
const moment = require('moment');

const ReportManager = require('../../../lib/ReportManager');
const db = require('../../../lib/db');
const Exchange = require('../exchange');

const TEMPLATE = './server/controllers/finance/reports/financial.all_employees.handlebars';

const PDF_OPTIONS = {
  filename : 'REPORT.EMPLOYEE_STANDING.FINANCIAL_SITUATION_EMPLOYEES',
};

/**
 * @param req
 * @param res
 * @function build
 * @description
 * This method builds the report of financial activities of an Employee.
 *
 * GET /reports/finance/employee_standing/:uuid
 */
async function build(req, res) {
  const opts = req.query;

  let filterBydatePosting = ``;
  let filterBydateLegder = ``;
  let dateExchangeRate;

  opts.limitTimeInterval = parseInt(opts.limitTimeInterval, 10);

  if (opts.limitTimeInterval && opts.dateFrom && opts.dateTo) {
    const transDateFrom = moment(opts.dateFrom).format('YYYY-MM-DD');
    const transDateTo = moment(opts.dateTo).format('YYYY-MM-DD');

    filterBydatePosting = ` WHERE (DATE(pj.trans_date) >= DATE('${transDateFrom}')
      AND DATE(pj.trans_date) <= DATE('${transDateTo}'))`;
    filterBydateLegder = ` WHERE (DATE(gl.trans_date) >= DATE('${transDateFrom}')
      AND DATE(gl.trans_date) <= DATE('${transDateTo}'))`;

    dateExchangeRate = transDateTo;
  } else {
    dateExchangeRate = new Date();
  }

  const options = { ...PDF_OPTIONS, ...opts };

  // set up the report with report manager
  const report = new ReportManager(TEMPLATE, req.session, options);

  const data = {};

  let sql;

  if (options.modeReport === 'summary') {
    data.summary = 1;

    sql = `
        SELECT SUM(aggr.debit) AS debit, SUM(aggr.credit) AS credit,
        CONCAT(aggr.number, ' - ', aggr.label) AS accountNumbelLabel,
        aggr.account_id, (SUM(aggr.debit) - SUM(aggr.credit)) AS solde
        FROM (
          SELECT pj.trans_id, pj.debit_equiv AS debit, pj.credit_equiv AS credit, pj.account_id,
          a.number, UPPER(a.label) AS label
          FROM posting_journal AS pj
          JOIN account AS a ON a.id = pj.account_id
          JOIN creditor AS cr ON cr.uuid = pj.entity_uuid
          JOIN employee AS emp ON emp.creditor_uuid = cr.uuid
          ${filterBydatePosting}
          UNION ALL
          SELECT gl.trans_id, gl.debit_equiv AS debit, gl.credit_equiv AS credit, gl.account_id,
          a.number, UPPER(a.label) AS label
          FROM general_ledger AS gl
          JOIN account AS a ON a.id = gl.account_id
          JOIN creditor AS cr ON cr.uuid = gl.entity_uuid
          JOIN employee AS emp ON emp.creditor_uuid = cr.uuid
          ${filterBydateLegder}
        ) AS aggr
        GROUP BY aggr.account_id
        ORDER BY aggr.number ASC
      `;
  } else if (options.modeReport === 'detailed') {
    data.detailed = 1;

    sql = `
        SELECT SUM(aggr.debit) AS debit, SUM(aggr.credit) AS credit,
        UPPER(aggr.employee_name) AS employee_name, CONCAT(aggr.number, ' - ', aggr.label) AS accountNumbelLabel,
        aggr.employee_uuid, aggr.account_id, (SUM(aggr.debit) - SUM(aggr.credit)) AS solde, aggr.code, aggr.reference
        FROM (
          SELECT pj.trans_id, pj.debit_equiv AS debit, pj.credit_equiv AS credit, pj.account_id,
          a.number, UPPER(a.label) AS label, p.display_name AS employee_name, emp.uuid AS employee_uuid,
          emp.code, map.text AS reference
          FROM posting_journal AS pj
          JOIN account AS a ON a.id = pj.account_id
          JOIN creditor AS cr ON cr.uuid = pj.entity_uuid
          JOIN employee AS emp ON emp.creditor_uuid = cr.uuid
          JOIN patient AS p ON p.uuid = emp.patient_uuid
          JOIN entity_map AS map ON map.uuid = emp.creditor_uuid
          ${filterBydatePosting}
          UNION ALL
          SELECT gl.trans_id, gl.debit_equiv AS debit, gl.credit_equiv AS credit, gl.account_id,
          a.number, UPPER(a.label) AS label, p.display_name AS employee_name, emp.uuid AS employee_uuid,
          emp.code, map.text AS reference
          FROM general_ledger AS gl
          JOIN account AS a ON a.id = gl.account_id
          JOIN creditor AS cr ON cr.uuid = gl.entity_uuid
          JOIN employee AS emp ON emp.creditor_uuid = cr.uuid
          JOIN patient AS p ON p.uuid = emp.patient_uuid
          JOIN entity_map AS map ON map.uuid = emp.creditor_uuid
          ${filterBydateLegder}
        ) AS aggr
        GROUP BY aggr.employee_uuid, aggr.account_id
        ORDER BY aggr.employee_name, aggr.number ASC
      `;
  } else if (options.modeReport === 'normal') {
    data.normal = 1;

    sql = `
        SELECT SUM(aggr.debit) AS debit, SUM(aggr.credit) AS credit,
        UPPER(aggr.employee_name) AS employee_name, CONCAT(aggr.number, ' - ', aggr.label) AS accountNumbelLabel,
        aggr.employee_uuid, aggr.account_id, (SUM(aggr.debit) - SUM(aggr.credit)) AS solde, aggr.code, aggr.reference
        FROM (
          SELECT pj.trans_id, pj.debit_equiv AS debit, pj.credit_equiv AS credit, pj.account_id,
          a.number, UPPER(a.label) AS label, p.display_name AS employee_name, emp.uuid AS employee_uuid,
          emp.code, map.text AS reference
          FROM posting_journal AS pj
          JOIN account AS a ON a.id = pj.account_id
          JOIN creditor AS cr ON cr.uuid = pj.entity_uuid
          JOIN employee AS emp ON emp.creditor_uuid = cr.uuid
          JOIN patient AS p ON p.uuid = emp.patient_uuid
          JOIN entity_map AS map ON map.uuid = emp.creditor_uuid
          ${filterBydatePosting}
          UNION ALL
          SELECT gl.trans_id, gl.debit_equiv AS debit, gl.credit_equiv AS credit, gl.account_id,
          a.number, UPPER(a.label) AS label, p.display_name AS employee_name, emp.uuid AS employee_uuid,
          emp.code, map.text AS reference
          FROM general_ledger AS gl
          JOIN account AS a ON a.id = gl.account_id
          JOIN creditor AS cr ON cr.uuid = gl.entity_uuid
          JOIN employee AS emp ON emp.creditor_uuid = cr.uuid
          JOIN patient AS p ON p.uuid = emp.patient_uuid
          JOIN entity_map AS map ON map.uuid = emp.creditor_uuid
          ${filterBydateLegder}
        ) AS aggr
        GROUP BY aggr.employee_uuid
        ORDER BY aggr.employee_name, aggr.number ASC
      `;
  }

  const currencyId = Number(options.currency_id);

  const [financialData, exchange] = await Promise.all([
    db.exec(sql),
    Exchange.getExchangeRate(req.session.enterprise.id, currencyId, dateExchangeRate),
  ]);

  data.currencyId = currencyId;
  data.exchangeRate = exchange.rate || 1;
  data.dateExchangeRate = dateExchangeRate;

  Object.assign(data, { financialData });

  // Calculate sums in one pass if necessary, or directly during assignment
  let sumDebit = 0, sumCredit = 0, sumBalance = 0;
  financialData.forEach(item => {
    sumDebit += item.debit || 0;
    sumCredit += item.credit || 0;
    sumBalance += item.solde || 0;
  });

  data.sumDebit = sumDebit;
  data.sumCredit = sumCredit;
  data.sumBalance = sumBalance;
  data.limitTimeInterval = options.limitTimeInterval === 1;

  if (options.limitTimeInterval) {
    data.dates = { dateFrom : options.dateFrom, dateTo : options.dateTo };
  }

  // rendr the report
  const result = await report.render(data);
  res.set(result.headers).send(result.report);
}

exports.report = build;
