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

const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');
const Exchange = require('../exchange');
const Accounts = require('.');

/**
 * @function getGeneralLedgerSQL
 *
 * @description
 * Used by the getAccountTransactions() function internally.  The internal SQL
 * just pulls out the values tied to a particular account.
 *
 * The exchange rate logic is complicated.  Here is the basic idea:
 *  1. If you are in the enterprise currency, you want the calculation to
 *    use ${amount} / rate to calculate the values.
 *  2. If the you not in the enterprise currency, you want to use ${amount} * rate
 *    to convert "back" to the enterprise currency.
 *
 */
function getGeneralLedgerSQL(options) {
  const filters = new FilterParser(options);

  options.isEnterpriseCurrency = options.isEnterpriseCurrency || false;

  // return the proper way to convert the values depending on if we are in the
  // exchange rate currency or not.
  const enterpriseCurrencyColumns = `
    (debit / rate) AS exchangedDebit, (credit / rate) AS exchangedCredit,
    (balance / rate) AS exchangedBalance,
    SUM((balance / rate)) OVER (
      ORDER BY trans_date ASC, created_at ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumsum
  `;

  const nonEnterpriseCurrencyColumns = `
    (debit * rate) AS exchangedDebit, (credit * rate) AS exchangedCredit,
    (balance * rate) AS exchangedBalance,
    SUM((balance * rate)) OVER (
      ORDER BY trans_date ASC, created_at ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumsum
  `;

  const columns = options.isEnterpriseCurrency ? enterpriseCurrencyColumns : nonEnterpriseCurrencyColumns;

  // get the underlying table for posted/unposted
  const subquery = getSubquery(options);
  const sql = `
    SELECT trans_id, description, trans_date, document_reference, debit, credit, posted, created_at,
      transaction_type_id, debit_equiv, credit_equiv, currency_id, rate, IF(rate < 1, (1 / rate), rate) AS invertedRate,
      ${columns}
      FROM (
      SELECT trans_id, description, trans_date, document_map.text AS document_reference,
        IF(${options.isEnterpriseCurrency},
          IFNULL(GetExchangeRate(${options.enterprise_id}, currency_id, trans_date), 1),
          IF(${options.currency_id} = currency_id, 1,
            IFNULL(GetExchangeRate(${options.enterprise_id}, ${options.currency_id}, trans_date), 1)
        )) AS rate,
        SUM(debit_equiv) as debit_equiv, SUM(credit_equiv) AS credit_equiv,
        (SUM(debit) - SUM(credit)) AS balance, SUM(debit) AS debit,
        SUM(credit) AS credit, MAX(currency_id) AS currency_id,
        ${options.includeUnpostedValues ? 'posted' : '1 as posted'}, created_at, transaction_type_id
      FROM ${subquery.query}
      LEFT JOIN document_map ON record_uuid = document_map.uuid
  `;

  filters.setGroup('GROUP BY record_uuid');
  filters.setOrder('ORDER BY trans_date ASC, created_at ASC');

  const query = filters.applyQuery(sql);
  const parameters = [...subquery.parameters, ...filters.parameters()];

  return { query, parameters };
}

/**
 * @function getTableSubquery
 *
 * @description
 * This function creates the subquery for each table (posting_journal and general_ledger)
 * depending on which table is passed in.
 */
function getTableSubquery(options, table) {
  const filters = new FilterParser(options);

  // selects 1 if the table is general_ledger or 0 if it is posting_journal
  const postedValue = (table === 'posting_journal') ? 0 : 1;

  const sql = `
  SELECT trans_id, description, trans_date, debit_equiv, credit_equiv, currency_id, debit, credit,
    account_id, record_uuid, reference_uuid, ${postedValue} as posted, created_at, transaction_type_id
  FROM ${table}`;

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
    const query = `(${postingJournalQuery.query} UNION ALL ${generalLedgerQuery.query}) AS ledger`;
    const parameters = [...postingJournalQuery.parameters, ...generalLedgerQuery.parameters];
    return { query, parameters };
  }

  const query = `(${generalLedgerQuery.query})z`;
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
    FROM ${subquery.query}
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
  const { query, parameters } = getGeneralLedgerSQL(options);

  // the running balance can only be in the enterprise currency.  It doesn't
  // make sense to have the running balance in any other currency.
  const sql = `
    SELECT c.trans_id, c.debit, c.credit, c.debit_equiv, c.credit_equiv, c.trans_date,
      c.document_reference, c.exchangedCredit, c.exchangedDebit, c.exchangedBalance,
      c.rate, ROUND(c.invertedRate, 2) AS invertedRate, (c.cumsum + ${openingBalance}),
      c.description, c.currency_id, c.posted, created_at, transaction_type_id,
    FROM (${query}) c
  `;

  const { totalsQuery, totalsParameters } = getTotalsSQL(options);

  // fire all requests in parallel for performance reasons
  const [account, transactions, totals] = await Promise.all([
    Accounts.lookupAccount(options.account_id),
    db.exec(sql, parameters),
    db.one(totalsQuery, totalsParameters),
  ]);

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

exports.getAccountTransactions = getAccountTransactions;
