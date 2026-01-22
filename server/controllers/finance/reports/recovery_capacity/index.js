/**
 * @overview ./finance/reports/recovery_capacity/
 */

const _ = require('lodash');
const moment = require('moment');

const ReportManager = require('../../../../lib/ReportManager');
const db = require('../../../../lib/db');
const Exchange = require('../../exchange');

module.exports.report = report;

// path to the template to render
const TEMPLATE = './server/controllers/finance/reports/recovery_capacity/report.handlebars';

const DEFAULT_OPTIONS = {
  filename : 'REPORT.RECOVERY_CAPACITY.TITLE',
  orientation : 'portrait',
};

/**
 * @method report
 *
 * @description
 * The HTTP interface which actually creates the report.
 */
async function report(req, res) {
  const qs = { ...DEFAULT_OPTIONS, ...req.query };
  const { dateFrom, dateTo } = req.query;
  const metadata = { ...req.session };

  const { enterprise } = req.session;
  const currencyId = Number(req.query.currencyId);

  const rpt = new ReportManager(TEMPLATE, metadata, qs);

  const CASH_PAYMENT_TRANSACTION_TYPE = 2;
  const CAUTION_TRANSACTION_TYPE = 19;
  const INVOICE_TRANSACTION_TYPE = 11;
  const INCOME_ACCOUNT_TYPE = 4;

  const formatedDateFrom = moment(dateFrom).format('YYYY-MM-DD');
  const formatedDateTo = moment(dateTo).format('YYYY-MM-DD');

  const daysWeek = [
    'FORM.LABELS.WEEK_DAYS.SUNDAY',
    'FORM.LABELS.WEEK_DAYS.MONDAY',
    'FORM.LABELS.WEEK_DAYS.TUESDAY',
    'FORM.LABELS.WEEK_DAYS.WEDNESDAY',
    'FORM.LABELS.WEEK_DAYS.THURSDAY',
    'FORM.LABELS.WEEK_DAYS.FRIDAY',
    'FORM.LABELS.WEEK_DAYS.SATURDAY',
  ];

  const includeUnpostedValues = qs.includeUnpostedValues ? Number(qs.includeUnpostedValues) : 0;

  let generalTable = `
      SELECT trans_id, trans_date, debit_equiv, credit_equiv,
        account_id, record_uuid, reference_uuid, transaction_type_id
      FROM general_ledger WHERE DATE(trans_date) BETWEEN DATE("${formatedDateFrom}") AND DATE("${formatedDateTo}")
    `;

  if (includeUnpostedValues) {
    generalTable += `
        UNION ALL
        SELECT trans_id, trans_date, debit_equiv, credit_equiv,
          account_id, record_uuid, reference_uuid, transaction_type_id
        FROM posting_journal WHERE DATE(trans_date) BETWEEN DATE("${formatedDateFrom}") AND DATE("${formatedDateTo}")
      `;
  }

  generalTable = `(${generalTable})`;

  /**
     * credit to :
     * https://www.shayanderson.com/mysql/generating-a-series-of-dates-in-mysql.htm
     */
  const dateRange = `
      SELECT DATE(cal.date) date
      FROM (
            SELECT
              SUBDATE(DATE(?), INTERVAL DATEDIFF(DATE(?), DATE(?)) DAY) + INTERVAL xc DAY AS date
            FROM (
                  SELECT @xi:=@xi+1 as xc from
                  (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) xc1,
                  (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) xc2,
                  (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) xc3,
                  (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) xc4,
                  (SELECT @xi:=-1) xc0
            ) xxc1
      ) cal
      WHERE cal.date <= DATE(?)
      ORDER BY cal.date ASC
    `;

  const patients = `
      SELECT DATE(p.registration_date) AS registration_date, COUNT(*) registrations
      FROM patient p
      WHERE DATE(p.registration_date) BETWEEN DATE(?) AND DATE(?)
      GROUP BY DATE(p.registration_date)
    `;

  const invoices = `
      SELECT DATE(gl.trans_date) invoice_date, SUM(IFNULL(credit_equiv - debit_equiv, 0)) AS total_invoiced
      FROM ${generalTable} gl
      JOIN invoice i ON i.uuid = gl.record_uuid
      JOIN account a ON a.id = gl.account_id
      WHERE gl.transaction_type_id IN (${INVOICE_TRANSACTION_TYPE})
        AND (DATE(gl.trans_date) >= DATE(?) AND DATE(gl.trans_date) <= DATE(?))
        AND i.reversed = 0 AND a.type_id = ${INCOME_ACCOUNT_TYPE}
      GROUP BY DATE(gl.trans_date)
    `;

  const payments = `
      SELECT DATE(gl.trans_date) trans_date, SUM(IFNULL(debit_equiv - credit_equiv, 0)) AS total_paid
      FROM ${generalTable} gl
      JOIN cash c ON c.uuid = gl.record_uuid
      WHERE gl.transaction_type_id IN (${CASH_PAYMENT_TRANSACTION_TYPE}, ${CAUTION_TRANSACTION_TYPE})
        AND (DATE(gl.trans_date) >= DATE(?) AND DATE(gl.trans_date) <= DATE(?))
        AND gl.account_id IN (?) AND c.reversed = 0
      GROUP BY DATE(gl.trans_date)
    `;

  const query = `
      SELECT
        d.date, IFNULL(pa.registrations, 0) registrations, i.total_invoiced, IFNULL(p.total_paid, 0) total_paid,
        IF(pa.registrations <> 0, (IFNULL(i.total_invoiced, 0) / pa.registrations), 0) avg_cost,
        IF(i.total_invoiced <> 0, ROUND((IFNULL(p.total_paid, 0) / i.total_invoiced), 2), 0) recovery_capacity,
        (IFNULL(pa.registrations, 0) + IFNULL(i.total_invoiced, 0) + IFNULL(p.total_paid, 0)) > 0 AS has_data
      FROM (${dateRange}) d
      LEFT JOIN (${invoices}) i ON i.invoice_date = d.date
      LEFT JOIN (${payments}) p ON p.trans_date = d.date
      LEFT JOIN (${patients}) pa ON pa.registration_date = d.date
      ORDER BY d.date
    `;

  const queryTotals = `
      SELECT w.registrations, w.total_invoiced, w.total_paid,
        IF(w.registrations <> 0, (IFNULL(w.total_invoiced, 0) / w.registrations), 0) avg_cost,
        IF(w.total_invoiced <> 0, ROUND((IFNULL(w.total_paid, 0) / w.total_invoiced), 2), 0) recovery_capacity
      FROM (
        SELECT
          SUM(IFNULL(pa.registrations, 0)) registrations,
          SUM(i.total_invoiced) total_invoiced,
          SUM(IFNULL(p.total_paid, 0)) total_paid,
          SUM(IF(pa.registrations <> 0, (IFNULL(i.total_invoiced, 0) / pa.registrations), 0)) avg_cost,
          SUM(IF(i.total_invoiced <> 0, ROUND((IFNULL(p.total_paid, 0) / i.total_invoiced), 2), 0)) recovery_capacity
        FROM (${dateRange}) d
        LEFT JOIN (${invoices}) i ON i.invoice_date = d.date
        LEFT JOIN (${payments}) p ON p.trans_date = d.date
        LEFT JOIN (${patients}) pa ON pa.registration_date = d.date
        ORDER BY d.date
      ) w;
  `;

  const queryAuxiliaryCashboxes = `
      SELECT cac.account_id AS id FROM cash_box_account_currency cac
      JOIN cash_box cb ON cb.id = cac.cash_box_id
      WHERE cb.is_auxiliary = 1;
    `;

  const auxiliaryCashboxesAccountRows = await db.exec(queryAuxiliaryCashboxes);
  const auxiliaryCashboxesAccountIds = auxiliaryCashboxesAccountRows.map(item => item.id);

  const parameters = [
    formatedDateTo, formatedDateTo, formatedDateFrom, formatedDateTo,
    formatedDateFrom, formatedDateTo,
    formatedDateFrom, formatedDateTo, auxiliaryCashboxesAccountIds,
    formatedDateFrom, formatedDateTo,
  ];

  const rows = await db.exec(query, parameters);
  const totals = await db.one(queryTotals, parameters);
  const getExchangeRateData = await Exchange.getExchangeRate(enterprise.id, currencyId, new Date(dateTo));
  const exchangeRate = getExchangeRateData.rate || 1;

  // Get the day of the week
  // Get summary of recover indicating %
  let rowLength = 0;

  let greenAbove70 = 0;
  let yellowBetwen60And70 = 0;
  let redLess60 = 0;

  let greenAbove70Percent = 0;
  let yellowBetwen60And70Percent = 0;
  let redLess60Percent = 0;

  rows.forEach(row => {
    const numDays = moment(row.date).day();
    row.dayOfWeek = daysWeek[numDays];

    if (row.total_invoiced > 0 || row.total_paid > 0) {
      rowLength += 1;
      row.active_day = 1;

      if (row.recovery_capacity > 0.7) {
        greenAbove70 += 1;
      }

      if (row.recovery_capacity >= 0.6 && row.recovery_capacity <= 0.7) {
        yellowBetwen60And70 += 1;
      }

      if (row.recovery_capacity < 0.6) {
        redLess60 += 1;
      }
    } else {
      row.active_day = 0;
    }
  });

  greenAbove70Percent = greenAbove70 / rowLength;
  yellowBetwen60And70Percent = yellowBetwen60And70 / rowLength;
  redLess60Percent = redLess60 / rowLength;

  const summary = {
    greenAbove70,
    yellowBetwen60And70,
    redLess60,
    greenAbove70Percent,
    yellowBetwen60And70Percent,
    redLess60Percent,
    rowLength,
  };

  const result = await rpt.render({
    dateFrom,
    dateTo,
    currencyId,
    exchangeRate,
    rows,
    totals,
    provisionary : includeUnpostedValues,
    summary,
  });

  res.set(result.headers).send(result.report);
}
