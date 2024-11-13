/**
 * @overview finance/reports/debtors/open.js
 *
 * @description
 * This report concerns the debtors that have open balances with the enterprise.
 *
 * Available options:
 *
 * LIMIT DATE
 * A user is allowed to specify a limitDate that will only consider debt accrued since that date.
 *
 * ORDER
 * The order parameter instructs the query how to sort the data from the server.  Available configurations
 * are:
 *  1) Invoice Date
 *  2) Amount of Debt
 *  3) Patient Name
 *
 * SHOW DETAILED VIEW
 * The report is available in a simple (faster, less detailed) view or a complex view (slower, more
 * detailed).  The complex view includes columns such as last invoice date and last payment date, which
 * may be useful in determining when the patient was present at the hospital.
 *
 * SHOW UNVERIFIED TRANSACTIONS
 * Includes unposted records from the Posting Journal.  In general, this option should be left unticked, as
 * it could provide misleading results.
 *
 * As usual, the reports are created with a handlebars template and shipped to
 * the client as either JSON, HTML, or PDF, depending on the renderer specified
 * in the HTTP query string.
 */

const _ = require('lodash');
const ReportManager = require('../../../../lib/ReportManager');
const db = require('../../../../lib/db');
const Exchange = require('../../exchange');

// path to the template to render
const TEMPLATE = './server/controllers/finance/reports/debtors/openDebtors.handlebars';

// converts '0' to false and '1' to true.
// defaults to false
function convertToBoolean(numberString) {
  if (numberString) {
    return Boolean(Number(numberString));
  }

  return false;
}

/**
 * Actually builds the open debtor report.
 */
function build(req, res, next) {
  const qs = _.extend(req.query, {
    filename : 'REPORT.OPEN_DEBTORS.TREE',
    csvKey : 'debtors',
  });

  const metadata = _.clone(req.session);

  qs.enterpriseId = metadata.enterprise.id;
  qs.enterpriseCurrencySymbol = metadata.enterprise.currencySymbol;

  let report;
  try {
    report = new ReportManager(TEMPLATE, metadata, qs);
  } catch (e) {
    return next(e);
  }

  // If any query values are not passed from the client, default values will be used
  return requestOpenDebtors(req.query)
    .then((openDebtorsContext) => {
      return report.render(openDebtorsContext);
    })
    .then((compiledReport) => {
      res.set(compiledReport.headers).send(compiledReport.report);
    })
    .catch(next)
    
}

// @TODO If unverifiedSource will continue to be used the where conditions should be put on each individual select
//       MySQL is not able to optimise indexed columns from a generic SELECT
function requestOpenDebtors(params) {
  const verifiedSource = 'general_ledger';

  // parameter parsing
  const showDetailedView = convertToBoolean(params.showDetailedView);
  const showUnverifiedTransactions = convertToBoolean(params.showUnverifiedTransactions);
  const limitDate = convertToBoolean(params.limitDate);
  const reportDateLimit = new Date(params.reportDateLimit);
  const currencyId = parseInt(params.currencyId, 10);
  const enterpriseId = parseInt(params.enterpriseId, 10);

  // TODO(@jniles) respect the ordering in the open debtors field.
  const ordering = parseOrdering(params.order);

  const unverifiedSource = `
    (SELECT entity_uuid, reference_uuid, trans_date, credit_equiv, debit_equiv from general_ledger
      UNION ALL
     SELECT entity_uuid, reference_uuid, trans_date, credit_equiv, debit_equiv from posting_journal) as source
  `;

  const source = showUnverifiedTransactions ? unverifiedSource : verifiedSource;

  // ONLY show transactions after a certain date (just show this week for example)
  const dateCondition = limitDate ? `AND DATE(trans_date) >= DATE(${db.escape(reportDateLimit)})` : '';

  const debtorQuery = buildDebtQuery(showDetailedView, source, dateCondition, ordering);

  const aggregateQuery = `
    SELECT COUNT(DISTINCT(entity_uuid)) as numDebtors, SUM(debit_equiv - credit_equiv) as balance
    FROM ${source}
    WHERE entity_uuid IS NOT NULL
    ${dateCondition}
    AND (debit_equiv - credit_equiv) > 0
  `;

  const debtorReport = {
    details : {
      showDetailedView,
      limitDate,
      reportDateLimit,
    },
    currencyId,
  };

  return Exchange.getExchangeRate(enterpriseId, currencyId, new Date())
    .then((exRate) => {
      debtorReport.exchangeRate = exRate.rate ? exRate.rate : 1;
      return db.exec(debtorQuery);
    })
    .then((debtorsDebts) => {
      debtorReport.debtors = debtorsDebts;
      return db.one(aggregateQuery);
    })
    .then((aggregateDebts) => {
      debtorReport.aggregates = aggregateDebts;
      return debtorReport;
    });
}

// ONLY select rows with an entity
// ONLY show debtors with a debt above 0
function buildDebtQuery(showDetailedView, source, dateCondition, ordering) {
  // Include complex parameters depending on detailed view Boolean requirements
  const complexParameters = showDetailedView
    ? ', MAX(invoice.date) as latestInvoiceDate, MAX(cash.date) as latestCashDate '
    : '';
  const complexJoin = showDetailedView
    ? 'LEFT JOIN invoice on reference_uuid = invoice.uuid LEFT JOIN cash on reference_uuid = cash.uuid '
    : '';

  // Include all balance and debtor information by default
  const query = `
    SELECT patient.display_name, entity_map.text as reference,
      SUM(debit_equiv - credit_equiv) as balance ${complexParameters}
    FROM ${source}
    JOIN patient on entity_uuid = patient.debtor_uuid
    LEFT JOIN entity_map on entity_map.uuid = entity_uuid
    ${complexJoin}
    WHERE entity_uuid IS NOT NULL
    ${dateCondition}
    GROUP BY entity_uuid
    HAVING SUM(debit_equiv - credit_equiv) > 0
    ORDER BY ${ordering}
  `;

  return query;
}

const orderMap = {
  'transaction-date-asc' : 'trans_date ASC',
  'transaction-date-desc' : 'trans_date DESC',
  'debt-desc' : 'balance DESC, trans_date DESC',
  'debt-asc' : 'balance ASC, trans_date DESC',
  'patient-name-desc' : 'patient.display_name DESC',
  'patient-name-asc' : 'patient.display_name ASC',
};

const DEFAULT_ORDER = 'debt-desc';

function parseOrdering(orderParameter) {
  return orderMap[orderParameter] || orderMap[DEFAULT_ORDER];
}

exports.report = build;
