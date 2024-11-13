/**
 * The /general_ledger HTTP API endpoint
 *
 * @module finance/generalLedger/
 *
 * @description
 * This module is responsible for producing the general ledger, which consists
 * of a giant matrix of the balances of each account for each period in a fiscal
 * year.  The fiscal year must be provided by the client.
 *
 * @requires lodash
 * @requires lib/db
 * @requires FilterParser
 * @requires lib/util
 */

// module dependencies
const Tree = require('@ima-worldhealth/tree');

const db = require('../../../lib/db');
const Journal = require('../journal');

const PERIODS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
];

// expose to the API
exports.list = list;
exports.getAggregates = getAggregates;
exports.getTransactions = getTransactions;

// expose to server controllers
exports.findTransactions = findTransactions;
exports.getAccountTotalsMatrix = getAccountTotalsMatrix;
exports.getAccountTotalsMatrixAggregates = getAccountTotalsMatrixAggregates;

/**
 * @function findTransactions
 * @description returns general ledger transactions
 * @param {object} options
 */
function findTransactions(options) {
  const RETURN_POSTED_TRANSACTIONS = true;
  const query = Journal.buildTransactionQuery(options, RETURN_POSTED_TRANSACTIONS);

  let limitCondition = '';
  if (options.limit) {
    limitCondition = ` LIMIT ${Number(options.limit)}`;
  }

  return db.exec(`(${query.sql}) ORDER BY trans_date DESC ${limitCondition}`, query.parameters);
}

/**
 * @function getTransactions
 * @description returns general ledger transactions
 */
function getTransactions(req, res, next) {
  const options = req.query;

  findTransactions(options)
    .then(rows => {
      res.status(200).json(rows);
    })
    .catch(next);
}

/**
 * @function list
 *
 * @description
 * List accounts and their balances.
 *
 * GET /general_ledger/
 */
function list(req, res, next) {
  const fiscalYearId = req.query.fiscal_year_id;

  getAccountTotalsMatrix(fiscalYearId)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next)
    
}

/**
 * @function getAggregates
 *
 * @description
 * Figures out the balances for the account totals matrix
 *
 *
 */
function getAggregates(req, res, next) {
  const fiscalYearId = req.query.fiscal_year_id;

  getAccountTotalsMatrixAggregates(fiscalYearId)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next)
    
}

/**
 * @function getAccountTotalsMatrix
 *
 * @description
 * This function gets the period totals for all accounts in a single fiscal
 * year.  Returns only accounts (and their parents) that contain balances.
 */
function getAccountTotalsMatrix(fiscalYearId) {
  // this creates a series of columns that only sum values if they are in the
  // correct period.
  const columns = PERIODS.reduce(
    (q, number) => `${q}, SUM(IF(p.number = ${number}, pt.debit - pt.credit, 0)) AS balance${number}`,
    '',
  );

  const outerColumns = PERIODS
    .map(number => `IFNULL(s.balance${number}, 0) AS balance${number}`)
    .join(', ');

  // we want to show every single account, so we do a left join of the account
  // table
  const sql = `
    SELECT a.id, a.number, a.label, a.type_id, a.parent,
      IFNULL(s.balance, 0) AS balance, ${outerColumns}
    FROM account AS a LEFT JOIN (
      SELECT SUM(pt.debit - pt.credit) AS balance, pt.account_id ${columns}
      FROM period_total AS pt
      JOIN period AS p ON p.id = pt.period_id
      WHERE pt.fiscal_year_id = ?
      GROUP BY pt.account_id
    )s ON a.id = s.account_id
    ORDER BY a.number;
  `;

  //  returns true if all the balances are 0
  const isEmptyRow = (row) => (
    row.balance === 0
    && row.balance0 === 0
    && row.balance1 === 0
    && row.balance2 === 0
    && row.balance3 === 0
    && row.balance4 === 0
    && row.balance5 === 0
    && row.balance6 === 0
    && row.balance7 === 0
    && row.balance8 === 0
    && row.balance9 === 0
    && row.balance10 === 0
    && row.balance11 === 0
    && row.balance12 === 0
  );

  return db.exec(sql, [fiscalYearId])
    .then(accounts => {
      const accountsTree = new Tree(accounts);

      // compute the values of the title accounts as the values of their children
      // takes O(n * m) time, where n is the number of nodes and m is the number
      // of periods
      const balanceKeys = ['balance', ...PERIODS.map(p => `balance${p}`)];
      const bulkSumFn = (currentNode, parentNode) => {
        balanceKeys.forEach(key => {
          parentNode[key] = (parentNode[key] || 0) + currentNode[key];
        });
      };

      accountsTree.walk(bulkSumFn, false);

      // prune empty rows
      accountsTree.prune(isEmptyRow);

      return accountsTree.toArray();
    });
}

function getAccountTotalsMatrixAggregates(fiscalYearId) {
  const columns = PERIODS.reduce(
    (q, number) => `${q}, SUM(IF(p.number = ${number}, pt.debit - pt.credit, 0)) AS balance${number}`,
    '',
  );

  const outerColumns = PERIODS
    .map(number => `IFNULL(s.balance${number}, 0) AS balance${number}`)
    .join(', ');

  const sql = `
    SELECT IFNULL(s.balance, 0) AS balance, ${outerColumns}
    FROM (
      SELECT SUM(pt.debit - pt.credit) AS balance, pt.account_id ${columns}
      FROM period_total AS pt
      JOIN period AS p ON p.id = pt.period_id
      WHERE pt.fiscal_year_id = ?
      GROUP BY pt.fiscal_year_id
    )s;
  `;

  return db.exec(sql, [fiscalYearId]);
}
