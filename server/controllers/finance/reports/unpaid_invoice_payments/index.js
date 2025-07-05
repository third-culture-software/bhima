const _ = require('lodash');
const db = require('../../../../lib/db');
const util = require('../../../../lib/util');
const Exchange = require('../../exchange');

const ReportManager = require('../../../../lib/ReportManager');

// path to the template to render
const TEMPLATE = './server/controllers/finance/reports/unpaid_invoice_payments/report.handlebars';

const DEFAULT_OPTIONS = {
  filename : 'REPORT.UNPAID_INVOICE_PAYMENTS_REPORT.TITLE',
  orientation : 'landscape',
};

exports.document = build;
exports.reporting = reporting;

async function build(req, res) {
  const { dateTo, serviceUuid } = req.query;
  const currencyId = Number(req.query.currencyId);
  const { enterprise } = req.session;

  const qs = _.extend({}, req.query, DEFAULT_OPTIONS);
  qs.enterprise = enterprise;

  const metadata = _.clone(req.session);

  const report = new ReportManager(TEMPLATE, metadata, qs);
  const results = (await getUnbalancedInvoices(qs)
    // provide empty data for the report to render
    || { dataset : [], totals : {}, services : [] });

  if (serviceUuid) {
    // If the user selected a service, force it to be used as "uniqueService"
    // even if no unpaid invoices for that service are found (to make the report clearer)
    const [serviceInfo] = await db.exec('SELECT name FROM service WHERE uuid = ?', db.bid(serviceUuid));
    qs.uniqueService = serviceInfo.name;
  }

  if (results.services.length === 1) {
    [qs.uniqueService] = results.services;
    // remove last column of total in the report rendered
    if (results.totals && results.totals.Total) {
      delete results.totals.Total;
    }
  }

  const data = _.extend({}, qs, results);

  const exchangeRate = await Exchange.getExchangeRate(enterprise.id, currencyId, new Date(dateTo));

  data.dateTo = dateTo;
  data.currencyId = currencyId;
  data.exchangeRate = exchangeRate.rate || 1;

  const compiled = await report.render(data);
  res.set(compiled.headers).send(compiled.report);
}

async function reporting(options, session) {
  const qs = _.extend(options, DEFAULT_OPTIONS);
  const metadata = _.clone(session);
  const report = new ReportManager(TEMPLATE, metadata, qs);
  const results = (await getUnbalancedInvoices(qs) || { dataset : [], totals : {}, services : [] });
  const data = _.extend({}, qs, results);
  return report.render(data);
}

/**
  * @function getUnbalancedInvoices
  *
  * @description
  * Gets a matrix of all unbalanced invoices by debtor group.  It explicitly ignores the
  * reversed invoices since they should be balanced anyway.
  */
async function getUnbalancedInvoices(options) {
  const exchange = await Exchange.getExchangeRate(
    options.enterprise.id, options.currencyId, new Date(options.dateTo),
  );

  // default to 1 if it is the enterprise currency.
  const exchangeRate = exchange.rate || 1;

  // creates a temporary table because the PIVOT interface requires a temporary table.
  const sql = `
    CREATE TEMPORARY TABLE unbalanced_invoices AS
    WITH
      InvoicesInPeriod AS (
        SELECT uuid, debtor_uuid, date
        FROM invoice
        WHERE DATE(date) BETWEEN DATE(?) AND DATE(?) AND reversed = 0
      ),
      AllLedgerEntries AS (
        SELECT i.uuid AS invoice_uuid, pj.debit_equiv, pj.credit_equiv
        FROM posting_journal pj JOIN InvoicesInPeriod i ON pj.record_uuid = i.uuid AND pj.entity_uuid = i.debtor_uuid
      UNION ALL
        SELECT i.uuid, gl.debit_equiv, gl.credit_equiv
        FROM general_ledger gl JOIN InvoicesInPeriod i ON gl.record_uuid = i.uuid AND gl.entity_uuid = i.debtor_uuid
      UNION ALL
        SELECT i.uuid, pj.debit_equiv, pj.credit_equiv
        FROM posting_journal pj JOIN InvoicesInPeriod i ON pj.reference_uuid = i.uuid AND pj.entity_uuid = i.debtor_uuid
      UNION ALL
        SELECT i.uuid, gl.debit_equiv, gl.credit_equiv
        FROM general_ledger gl JOIN InvoicesInPeriod i ON gl.reference_uuid = i.uuid AND gl.entity_uuid = i.debtor_uuid
      ),
      InvoiceBalances AS (
        SELECT
          invoice_uuid,
          SUM(debit_equiv) AS total_debit,
          SUM(credit_equiv) AS total_credit,
          SUM(debit_equiv) - SUM(credit_equiv) AS balance
        FROM AllLedgerEntries
        GROUP BY invoice_uuid
        HAVING balance <> 0
      )
    SELECT
      BUID(ivc.uuid) AS invoice_uuid,
      em.text AS debtorReference,
      d.text AS debtorName,
      BUID(d.uuid) AS debtorUuid,
      (b.total_debit * ?) AS debit,
      (b.total_credit * ?) AS credit,
      (b.balance * ?) AS balance,
      ivc.date AS creation_date,
      dm.text AS reference,
      ivc.project_id,
      p.name AS projectName,
      dg.name AS debtorGroupName,
      s.name AS serviceName,
      s.uuid AS serviceUuid,
      ((b.total_credit * ?) / IF(b.total_debit = 0, 1, b.total_debit * ?)) * 100 AS paymentPercentage
    FROM InvoiceBalances b
      JOIN invoice ivc ON ivc.uuid = b.invoice_uuid
      JOIN service s ON s.uuid = ivc.service_uuid
      JOIN debtor d ON d.uuid = ivc.debtor_uuid
      JOIN debtor_group dg ON dg.uuid = d.group_uuid
      JOIN project p ON p.id = ivc.project_id
      LEFT JOIN document_map dm ON dm.uuid = b.invoice_uuid
      LEFT JOIN entity_map em ON em.uuid = d.uuid
    ORDER BY ivc.date;
`;

  const { debtorGroupName, serviceUuid } = options;

  let wherePart = debtorGroupName ? `WHERE debtorGroupName = ${db.escape(debtorGroupName)}` : '';
  if (serviceUuid) {
    wherePart = (wherePart.length < 2)
      ? `WHERE serviceUuid = HUID('${serviceUuid}')`
      : `${wherePart} AND serviceUuid = HUID('${serviceUuid}')`;
  }

  const params = [
    new Date(options.dateFrom),
    new Date(options.dateTo),
    exchangeRate,
    exchangeRate,
    exchangeRate,
    exchangeRate,
    exchangeRate,
  ];

  const rows = await db.transaction()
    .addQuery(sql, params)
    .addQuery(`CALL Pivot(
        "unbalanced_invoices",
        "debtorGroupName,debtorUuid",
        "serviceName",
        "balance",
        "${wherePart}",
        ""
      );
    `)
    .execute();

  const records = rows.at(-1);
  const dataset = records[records.length - 2];

  // get a list of the keys in the dataset
  const keys = _.keys(_.clone(dataset[0]));

  const debtorUuids = dataset
    .filter(row => row.debtorUuid)
    .map(row => db.bid(row.debtorUuid));

  // make human readable names for the users
  const debtorNames = await db.exec(`
    SELECT BUID(debtor.uuid) AS uuid, em.text as reference, debtor.text, p.dob
    FROM debtor JOIN entity_map em ON debtor.uuid = em.uuid
    LEFT JOIN patient p ON p.debtor_uuid = debtor.uuid
    WHERE debtor.uuid IN (?);
  `, [debtorUuids]);

  const debtorNameMap = _.keyBy(debtorNames, 'uuid');

  // the omit the first three columns and the last (totals) to get the services
  const services = _.dropRight(_.drop(keys, 2), 1);

  // the last line is the total row
  const totals = dataset.pop();

  // add properties for drawing a pretty grid.
  dataset.forEach(row => {
    if (!row.debtorUuid) {
      row.isTotalRow = true;
      row.hideTotalRow = !!(debtorGroupName && row.isTotalRow);
    }

    if (!row.debtorGroupName) {
      row.isGroupTotalRow = true;
    }
    // add pretty debtor names
    const debtor = debtorNameMap[row.debtorUuid];
    if (debtor) {
      row.debtorReference = debtor.reference;
      row.debtorText = debtor.text;
      row.debtorAge = util.calculateAge(debtor.dob);
    }
  });

  return { dataset, services, totals };
}
