/**
 * @overview ./finance/reports/client_debts/
*/

const _ = require('lodash');

const ReportManager = require('../../../../lib/ReportManager');
const db = require('../../../../lib/db');

module.exports.report = report;

// path to the template to render
const TEMPLATE = './server/controllers/finance/reports/client_support/report.handlebars';

const DEFAULT_OPTIONS = { filename : 'REPORT.CLIENT_SUPPORT.TITLE' };

/**
 * @method report
 *
 * @description
 * The HTTP interface which actually creates the report.
 */
async function report(req, res) {
  const qs = { ...req.query, ...DEFAULT_OPTIONS };
  const { dateFrom, dateTo } = req.query;
  const showEmployeeSupport = parseInt(req.query.shouldShowEmployeeSupport, 10);
  const showOtherSupport = parseInt(req.query.shouldShowOtherSupport, 10);
  const showDetails = parseInt(req.query.shouldShowDetails, 10);
  const metadata = structuredClone(req.session);

  const rpt = new ReportManager(TEMPLATE, metadata, qs);

  const SUPPORT_TRANSACTION_TYPE = 4;

  const employeeSupportQuery = `
      SELECT
        em.text AS reference, a.label, dg.name, p.display_name,
        SUM(i.credit_equiv - i.debit_equiv) AS balance,
        CONCAT(z.display_name, ' (', z.reference, ')') AS employee_name,
        z.balance AS employee_support, z.label AS employee_account
      FROM general_ledger i
      JOIN account a ON a.id = i.account_id
      JOIN debtor d ON d.uuid = i.entity_uuid
      JOIN debtor_group dg ON dg.uuid = d.group_uuid
      JOIN patient p ON p.debtor_uuid = d.uuid
      JOIN entity_map em ON em.uuid = p.uuid
      JOIN (
        SELECT
          gl.record_uuid, a.label, p.display_name,
          (gl.debit_equiv - gl.credit_equiv) AS balance, em.text AS reference
        FROM general_ledger gl
        JOIN account a ON a.id = gl.account_id
        JOIN creditor c ON c.uuid = gl.entity_uuid
        JOIN employee e ON e.creditor_uuid = c.uuid
        JOIN patient p ON p.uuid = e.patient_uuid
        JOIN entity_map em ON em.uuid = e.creditor_uuid
        WHERE (gl.trans_date BETWEEN ? AND ?) AND gl.transaction_type_id = ${SUPPORT_TRANSACTION_TYPE}
      ) z ON z.record_uuid = i.record_uuid
    `;

  const otherSupportQuery = `
      SELECT
        a.label, dg.name, p.display_name,
        SUM(i.credit_equiv - i.debit_equiv) AS balance, z.label AS recipient_account
      FROM general_ledger i
      JOIN account a ON a.id = i.account_id
      JOIN debtor d ON d.uuid = i.entity_uuid
      JOIN debtor_group dg ON dg.uuid = d.group_uuid
      JOIN patient p ON p.debtor_uuid = d.uuid
      JOIN (
        SELECT gl.record_uuid, a.label, (gl.debit_equiv - gl.credit_equiv) AS balance, gl.entity_uuid
        FROM general_ledger gl
        JOIN account a ON a.id = gl.account_id
        WHERE (gl.trans_date BETWEEN ? AND ?)
          AND gl.transaction_type_id = ${SUPPORT_TRANSACTION_TYPE} AND gl.entity_uuid IS NULL
      ) z ON z.record_uuid = i.record_uuid
    `;

  const groupByDebtor = ' GROUP BY d.uuid ORDER BY p.display_name; ';
  const parameters = [dateFrom, dateTo];

  const [
    employeeSupportTotal,
    employeeSupport,
    otherSupportTotal,
    otherSupport,
  ] = await Promise.all([
    db.one(employeeSupportQuery, parameters),
    db.exec(employeeSupportQuery.concat(groupByDebtor), parameters),
    db.one(otherSupportQuery, parameters),
    db.exec(otherSupportQuery.concat(groupByDebtor), parameters),
  ]);

  const employeesCollection = generateTree(employeeSupport, 'employee_name')
    .map(e => {
      // organize tree by debtor group name
      e.data = generateTree(e.data, 'name');
      return e;
    });

  const othersCollection = generateTree(otherSupport, 'recipient_account')
    .map(e => {
      // organize tree by debtor group name
      e.data = generateTree(e.data, 'name');
      return e;
    });

  const result = await rpt.render({
    employeeSupportTotal,
    employeesCollection,
    otherSupportTotal,
    othersCollection,
    dateFrom,
    dateTo,
    showDetails,
    showEmployeeSupport,
    showOtherSupport,
  });

  res.set(result.headers).send(result.report);
}

function generateTree(array, groupBy) {
  return _(array)
    .groupBy(groupBy)
    .map((value, key) => {
      return {
        key,
        data : value,
        total : _.sumBy(value, 'balance'),
        number : value.length,
      };
    })
    .sortBy(['key'], ['asc'])
    .value();
}
