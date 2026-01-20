/**
 * @overview ./finance/reports/realized_profit/
 */

const _ = require('lodash');
const moment = require('moment');

const ReportManager = require('../../../../lib/ReportManager');
const db = require('../../../../lib/db');

module.exports.report = report;

// path to the template to render
const TEMPLATE = './server/controllers/finance/reports/realized_profit/report.handlebars';

const DEFAULT_OPTIONS = {
  filename : 'REPORT.REALIZED_PROFIT.TITLE',
  orientation : 'landscape',
};

/**
 * @method report
 *
 * @description
 * The HTTP interface which actually creates the report.
 */
async function report(req, res) {
  const qs = _.extend(req.query, DEFAULT_OPTIONS);
  const { dateFrom, dateTo } = req.query;
  const showRemainDetails = parseInt(req.query.shouldShowRemainDetails, 10);
  const showPaidDetails = parseInt(req.query.shouldShowPaidDetails, 10);
  const showInvoicedDetails = parseInt(req.query.shouldShowInvoicedDetails, 10);
  const metadata = structuredClone(req.session);

  const rpt = new ReportManager(TEMPLATE, metadata, qs);

  const CASH_PAYMENT_TRANSACTION_TYPE = 2;
  const CAUTION_TRANSACTION_TYPE = 19;
  const CONVENTION_TRANSACTION_TYPE = 3;

  const normalPayment = `
      SELECT reference_uuid, SUM(IFNULL(credit_equiv - debit_equiv, 0)) AS paid FROM general_ledger
      WHERE transaction_type_id = ${CASH_PAYMENT_TRANSACTION_TYPE}
      GROUP BY reference_uuid
    `;

  const cautionPayment = `
      SELECT reference_uuid, SUM(IFNULL(credit_equiv - debit_equiv, 0)) AS paid FROM general_ledger
      WHERE transaction_type_id = ${CAUTION_TRANSACTION_TYPE}
      GROUP BY reference_uuid
    `;

  const conventionPayment = `
      SELECT reference_uuid, SUM(IFNULL(credit_equiv - debit_equiv, 0)) AS paid FROM general_ledger
      WHERE transaction_type_id = ${CONVENTION_TRANSACTION_TYPE}
      GROUP BY reference_uuid
    `;

  const globalQuery = `
      SELECT
        c.invoiced, (c.normal_paid + c.caution_paid + c.convention_paid) AS paid,
        c.debtorGroupName, c.serviceName, c.invoice_uuid, BUID(c.service_uuid) AS service_uuid, c.debtor_group_uuid
      FROM (
        SELECT
          SUM(gl.debit_equiv - gl.credit_equiv) AS invoiced,
          IFNULL(z.paid, 0) AS normal_paid, IFNULL(x.paid, 0) AS caution_paid, IFNULL(y.paid, 0) AS convention_paid,
          dg.name debtorGroupName, s.name serviceName,
          iv.uuid AS invoice_uuid, iv.service_uuid, dg.uuid AS debtor_group_uuid
        FROM general_ledger gl
        JOIN invoice iv ON iv.uuid = gl.record_uuid
        JOIN service s ON s.uuid = iv.service_uuid
        LEFT JOIN (${normalPayment})z ON z.reference_uuid = iv.uuid
        LEFT JOIN (${cautionPayment})x ON x.reference_uuid = iv.uuid
        LEFT JOIN (${conventionPayment})y ON y.reference_uuid = iv.uuid
        JOIN debtor d ON d.uuid = gl.entity_uuid
        JOIN debtor_group dg ON dg.uuid = d.group_uuid
        WHERE iv.reversed = 0 AND (DATE(gl.trans_date) >= ? AND DATE(gl.trans_date) <= ?)
        GROUP BY iv.uuid, iv.service_uuid, dg.uuid
      )c
    `;

  const groupByServiceAndDebtorGroup = `
      GROUP BY w.service_uuid, w.debtor_group_uuid
    `;

  const tableQuery = `
      SELECT
        SUM(w.paid) paid, SUM(w.invoiced) invoiced, SUM(w.invoiced - w.paid) remaining,
        w.debtorGroupName, w.serviceName, w.service_uuid, w.debtor_group_uuid
      FROM (${globalQuery})w
    `;

  const parameters = [
    moment(dateFrom).format('YYYY-MM-DD'), moment(dateTo).format('YYYY-MM-DD'),
  ];

  const transaction = db.transaction();
  const tempTable = 'invoicePaymentsPivotTable';
  const createTempTable = `
      CREATE TEMPORARY TABLE ${tempTable} AS (${tableQuery.concat(groupByServiceAndDebtorGroup)});
    `;

  transaction.addQuery(`DROP TEMPORARY TABLE IF EXISTS ${tempTable};`);
  transaction.addQuery(createTempTable, parameters);
  transaction.addQuery(`CALL Pivot('${tempTable}', 'debtorGroupName', 'serviceName', 'remaining', '', '')`);
  transaction.addQuery(`CALL Pivot('${tempTable}', 'debtorGroupName', 'serviceName', 'paid', '', '')`);
  transaction.addQuery(`CALL Pivot('${tempTable}', 'debtorGroupName', 'serviceName', 'invoiced', '', '')`);
  transaction.addQuery(`${tableQuery}`, parameters);

  const rows = await transaction.execute();
  const remainingTable = rows[2][0];
  const remainingMatrix = matrix(remainingTable);

  const paidTable = rows[3][0];
  const paidMatrix = matrix(paidTable);

  const invoicedTable = rows[4][0];
  const invoicedMatrix = matrix(invoicedTable);

  const [totals] = rows[5];
  totals.paidRatio = totals.invoiced ? (totals.paid / totals.invoiced) : 0;
  totals.remainingRatio = totals.invoiced ? (totals.remaining / totals.invoiced) : 0;

  const result = await rpt.render({
    dateFrom,
    dateTo,
    totals,
    remainingMatrix,
    paidMatrix,
    invoicedMatrix,
    showRemainDetails,
    showPaidDetails,
    showInvoicedDetails,
  });

  res.set(result.headers).send(result.report);
}

function matrix(dataset) {
  const headers = Object
    .keys(dataset[dataset.length - 1] || {})
    .filter(col => col !== 'debtorGroupName');

  const data = dataset.map(row => {
    const values = headers.map(key => row[key]);
    return [row.debtorGroupName, ...values];
  });

  return { headers, data };
}
