/**
 * @overview AccountTransactions
 *
 * @description
 * This file provides a common tool for reading the transations associated with an account.
 * It provides a re-usable interface to access this information, and supports:
 *  1. Inclusion of non-posted records
 *  2. Exchange Rate Calculation
 *  3. Running Balance Calculation
 *
 */

const debug = require('debug')('accounts:transactions');
const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');
const Exchange = require('../exchange');
const Accounts = require('.');

/**
 * @function getTableSubquery
 *
 * @description
 * This function creates the subquery for each table (posting_journal and general_ledger)
 * depending on which table is passed in.
 */
function getTableSubquery(options, tableName) {
  const filters = new FilterParser(options);

  // selects 1 if the table is general_ledger or 0 if it is posting_journal
  const postedValue = (tableName === 'posting_journal') ? 0 : 1;

  const sql = `
  SELECT trans_id, description, trans_date, debit_equiv, credit_equiv, currency_id, debit, credit,
    account_id, record_uuid, reference_uuid, ${postedValue} as posted, created_at, transaction_type_id
  FROM ${tableName}`;

  filters.equals('account_id');
  filters.dateFrom('dateFrom', 'trans_date');
  filters.dateTo('dateTo', 'trans_date');
  filters.period('period', 'date');
  filters.equals('transaction_type_id');

  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  return { query, parameters };
}

/**
 * @function getSubquery
 *
 * @description
 * This function constructs the underlying base tables for posted/unposted values from the general_ledger or
 * a UNION of the posting_journal and general_ledger.
 */
function getSubquery(options) {
  const postingJournalQuery = getTableSubquery(options, 'posting_journal');
  const generalLedgerQuery = getTableSubquery(options, 'general_ledger');

  if (options.includeUnpostedValues) {
    const query = `(${postingJournalQuery.query} UNION ALL ${generalLedgerQuery.query})`;
    const parameters = [...postingJournalQuery.parameters, ...generalLedgerQuery.parameters];
    return { query, parameters };
  }

  const query = `(${generalLedgerQuery.query})`;
  const { parameters } = generalLedgerQuery;
  return { query, parameters };
}

// @TODO define standards for displaying and rounding totals, unless numbers are rounded
//       uniformly they may be displayed differently from what is recorded
function getTotalsSQL(options) {
  const currencyId = options.currency_id || options.enterprise_currency_id;

  // get the underlying dataset based on the posted/unposted flag
  const subquery = getSubquery(options);

  const totalsQuery = `
    SELECT
      IFNULL(GetExchangeRate(${options.enterprise_id}, ${currencyId}, NOW()), 1) AS rate,
      ${currencyId} AS currency_id,
      SUM(ROUND(debit, 2)) AS debit, SUM(ROUND(credit, 2)) AS credit,
      SUM(ROUND(debit_equiv, 2)) AS debit_equiv, SUM(ROUND(credit_equiv, 2)) AS credit_equiv,
      (SUM(ROUND(debit_equiv, 2)) - SUM(ROUND(credit_equiv, 2))) AS balance
    FROM (${subquery.query}) AS ledger
  `;

  const totalsParameters = subquery.parameters;

  return { totalsQuery, totalsParameters };
}

/**
 * @function getAccountTransactions
 *
 * @description
 * This function returns all the transactions for an account,
 */
async function getAccountTransactions(options, openingBalance = 0) {
  debug(`Fetching data for account_id: ${options.account_id}`);
  const { query, parameters } = buildLedgerSQL(options, openingBalance);
  const { totalsQuery, totalsParameters } = getTotalsSQL(options);

  // fire all requests in parallel for performance reasons
  const [account, transactions, totals] = await Promise.all([
    Accounts.lookupAccount(options.account_id),
    db.exec(query, parameters),
    db.one(totalsQuery, totalsParameters),
  ]);

  debug(`The account number is ${account.account_number} with a total of ${transactions.length} transactions.`);
  debug(`Opening Balance of ${account.account_number} is ${openingBalance}.`);

  // alias the unposted record flag for styling with italics
  let hasUnpostedRecords = false;
  transactions.forEach(txn => {
    txn.isUnposted = txn.posted === 0;
    if (txn.isUnposted) { hasUnpostedRecords = true; }
  });

  // if there is data in the transaction array, use the date of the last transaction
  const lastTransaction = transactions.at(-1);
  const lastDate = (lastTransaction && lastTransaction.trans_date) || options.dateTo;

  const hasLastCumSum = lastTransaction?.cumsum !== undefined;
  const lastCumSum = hasLastCumSum ? lastTransaction.cumsum : (totals.balance * totals.rate);

  // tells the report if it is safe to render the debit/credit sum.  It is only safe
  // if the currency_id is consistent throughout the entire span
  const lastCurrencyId = (lastTransaction && lastTransaction.currency_id) || totals.currency_id;
  const shouldDisplayDebitCredit = transactions.every(txn => txn.currency_id === lastCurrencyId);

  // contains the grid totals for the footer
  const footer = {
    date : lastDate,
    exchangedBalance : totals.balance * totals.rate,
    exchangedCumSum : lastCumSum,
    exchangedDate : new Date(),
    invertedRate : Exchange.formatExchangeRateForDisplay(totals.rate),
    shouldDisplayDebitCredit,
    transactionCurrencyId : lastCurrencyId,

    // add totals into the footer
    totals,
  };

  return {
    account, transactions, hasUnpostedRecords, footer,
  };
}

/**
 * @function buildLedgerSQL
 *
 * @description
 *
 * Used by the getAccountTransactions() function internally.  The internal SQL
 * just pulls out the values tied to a particular account.
 *
 * Constructs a single SQL statement (plus parameters) that:
 * 1) Builds a combined ledger from general_ledger and (optionally) posting_journal
 * 2) Joins the document_map
 * 3) Sums results grouped by record_uuid
 * 4) Converts amounts using a rate
 * 5) Computes a running total (cumsum) using a window function
 */
function buildLedgerSQL(options, openingBalance = 0) {
  const filters = new FilterParser(options);

  // Decide if we include posted/unposted data or only posted
  const tableQueries = [];
  const tableParams = [];

  // Always build the general ledger subquery
  const { query : glQuery, parameters : glParams } = getTableSubquery(options, 'general_ledger');

  tableQueries.push(glQuery);
  tableParams.push(...glParams);

  // Conditionally build the posting journal subquery for unposted records
  if (options.includeUnpostedValues) {
    const { query : pjQuery, parameters : pjParams } = getTableSubquery(options, 'posting_journal');

    tableQueries.push(pjQuery);
    tableParams.push(...pjParams);
  }

  // Combine data via UNION ALL if both posted/unposted are included
  const unionSQL = `(${tableQueries.join(' UNION ALL ')}) as ledger`;

  // Build grouping statement
  // Once grouped per record_uuid, we apply the currency conversion logic
  const groupingSQL = `
    SELECT
      trans_id,
      description,
      trans_date,
      document_map.text AS document_reference,
      created_at,
      transaction_type_id,
      MAX(currency_id) AS currency_id,
      SUM(debit) AS debit,
      SUM(credit) AS credit,
      SUM(debit_equiv) AS debit_equiv,
      SUM(credit_equiv) AS credit_equiv,
      (SUM(debit) - SUM(credit)) AS balance,
      posted,
      IF(${options.isEnterpriseCurrency},
        IFNULL(GetExchangeRate(${options.enterprise_id}, MAX(currency_id), trans_date), 1),
        IF(${options.currency_id} = MAX(currency_id), 1,
          IFNULL(GetExchangeRate(${options.enterprise_id}, ${options.currency_id}, trans_date), 1)
        )
      ) AS rate
    FROM ${unionSQL}
    LEFT JOIN document_map ON ledger.record_uuid = document_map.uuid
  `;

  // Apply grouping and ordering from FilterParser
  filters.setGroup('GROUP BY ledger.record_uuid');
  filters.setOrder('ORDER BY trans_date ASC, created_at ASC');
  const groupedQuery = filters.applyQuery(groupingSQL);
  const groupingParams = [...tableParams, ...filters.parameters()];

  // Next, translate amounts to "exchanged" values plus cumsum in an outer SELECT
  // Note: we handle enterprise-currency logic using the rate above
  const columns = `
    debit,
    credit,
    debit_equiv,
    credit_equiv,
    trans_date,
    document_reference,
    created_at,
    transaction_type_id,
    currency_id,
    posted,
    rate,
    IF(rate < 1, (1 / rate), rate) AS invertedRate,
    CASE
      WHEN ${options.isEnterpriseCurrency} THEN (balance / rate)
      ELSE (balance * rate)
    END AS exchangedBalance,
    CASE
      WHEN ${options.isEnterpriseCurrency} THEN (debit / rate)
      ELSE (debit * rate)
    END AS exchangedDebit,
    CASE
      WHEN ${options.isEnterpriseCurrency} THEN (credit / rate)
      ELSE (credit * rate)
    END AS exchangedCredit,
    SUM(
      CASE
        WHEN ${options.isEnterpriseCurrency} THEN (balance / rate) 
        ELSE (balance * rate)
      END
    ) OVER (
      ORDER BY trans_date ASC, created_at ASC
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) + ${openingBalance} AS cumsum
  `;

  const finalSQL = `
    SELECT
      trans_id,
      description,
      ${columns}
    FROM (
      ${groupedQuery}
    ) AS groupedLedger
    ORDER BY trans_date ASC, created_at ASC
  `;

  return { query : finalSQL, parameters : groupingParams };
}

exports.getAccountTransactions = getAccountTransactions;
