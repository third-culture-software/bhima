/**
 * @module controllers/finance/creditors
 *
 * @description
 * This file contains lookup routes for creditors, as needed by the complex
 * journal vouchers page.
 *
 * @requires db
 * @requires NotFound
 */

const moment = require('moment');
const db = require('../../lib/db');
const NotFound = require('../../lib/errors/NotFound');
const FilterParser = require('../../lib/filter');

exports.list = list;
exports.detail = detail;
exports.getFinancialActivity = getFinancialActivity;

/**
 * GET /creditors
 * @todo integration tests for this function
 */
function list(req, res, next) {
  const options = req.query;

  db.convert(options, ['uuid', 'group_uuid']);
  const filters = new FilterParser(options, { tableAlias : 'c' });

  const sql = `
    SELECT BUID(c.uuid) as uuid, c.text, cg.name, BUID(c.group_uuid) as group_uuid,
      a.id AS account_id, a.number, em.text as hrEntity
    FROM creditor AS c
    JOIN creditor_group AS cg
    JOIN account AS a ON c.group_uuid = cg.uuid AND cg.account_id = a.id
    LEFT JOIN entity_map me ON em.uuid = c.uuid
  `;

  filters.equals('uuid');
  filters.equals('creditor_uuid');
  filters.custom('hrEntity', 'em.text = ?');

  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  db.exec(query, parameters)
    .then(rows => { res.status(200).json(rows); })
    .catch(next);
}

/**
 * GET /creditors/:uuid
 * @todo integration tests for this function
 */
function detail(req, res, next) {
  const sql = `
    SELECT BUID(c.uuid) as uuid, c.text, cg.name, BUID(c.group_uuid) as group_uuid,
      a.id AS account_id, a.number
    FROM creditor AS c JOIN creditor_group AS cg JOIN account AS a
      ON c.group_uuid = cg.uuid AND cg.account_id = a.id
    WHERE c.uuid = ?;
  `;

  db.exec(sql, [db.bid(req.params.uuid)])
    .then((rows) => {
      if (!rows.length) {
        throw new NotFound(`Could not find creditor with uuid ${req.params.uuid}.`);
      }

      res.status(200).json(rows[0]);
    })
    .catch(next);

}

/**
 * This function returns the balance of a creditor account with the hospital.
 *
 * The algorithm works like this:
 *  1) Look up all transaction lines associated with that creditor and sum the
 *  debits and credits.
 *
 * NOTE - this function is not suitable for reporting, and should only be used
 * by modules that need up-to-the minute debtor status.  There is no control
 * over the dataset queried only the creditor
 *
 * @method balance
 */
function balance(creditorUuid) {
  const creditorUid = db.bid(creditorUuid);

  const sql = `
    SELECT IFNULL(SUM(ledger.debit_equiv), 0) AS debit, IFNULL(SUM(ledger.credit_equiv), 0) AS credit,
      IFNULL(SUM(ledger.credit_equiv - ledger.debit_equiv), 0) AS balance, MIN(trans_date) AS since,
      MAX(trans_date) AS until
    FROM (
      SELECT debit_equiv, credit_equiv, entity_uuid, trans_date FROM posting_journal WHERE entity_uuid = ?
      UNION ALL
      SELECT debit_equiv, credit_equiv, entity_uuid, trans_date FROM general_ledger WHERE entity_uuid = ?
    ) AS ledger
    GROUP BY ledger.entity_uuid;
  `;

  return db.exec(sql, [creditorUid, creditorUid]);
}

/**
 * This function returns the Opening balance of a creditor account with the hospital
 * until a date from
 *
 * @method openingBalanceCreditor
 */
function openingBalanceCreditor(creditorUuid, dateFrom) {
  const creditorUid = db.bid(creditorUuid);

  const sql = `
    SELECT IFNULL(SUM(ledger.debit_equiv), 0) AS debit, IFNULL(SUM(ledger.credit_equiv), 0) AS credit,
      IFNULL(SUM(ledger.credit_equiv - ledger.debit_equiv), 0) AS balance, MIN(trans_date) AS since,
      MAX(trans_date) AS until
    FROM (
      SELECT debit_equiv, credit_equiv, entity_uuid, trans_date FROM posting_journal WHERE entity_uuid = ?
      AND DATE(trans_date) < DATE(?)
      UNION ALL
      SELECT debit_equiv, credit_equiv, entity_uuid, trans_date FROM general_ledger WHERE entity_uuid = ?
      AND DATE(trans_date) < DATE(?)
    ) AS ledger
    GROUP BY ledger.entity_uuid;
  `;

  return db.exec(sql, [creditorUid, dateFrom, creditorUid, dateFrom]);
}

/**
 * @function getFinancialActivity
 *
 * @description
 * returns all transactions and balances associated with the Creditor.
 */
function getFinancialActivity(creditorUuid, dateFrom, dateTo) {
  const uid = db.bid(creditorUuid);
  let filterBydatePosting = ``;
  let filterBydateLegder = ``;

  if (dateFrom && dateTo) {
    const transDateFrom = moment(dateFrom).format('YYYY-MM-DD');
    const transDateTo = moment(dateTo).format('YYYY-MM-DD');

    filterBydatePosting = ` AND (DATE(p.trans_date) >= DATE('${transDateFrom}')
      AND DATE(p.trans_date) <= DATE('${transDateTo}'))`;
    filterBydateLegder = ` AND (DATE(g.trans_date) >= DATE('${transDateFrom}')
      AND DATE(g.trans_date) <= DATE('${transDateTo}'))`;
  }

  const sql = `
    SELECT trans_id, BUID(entity_uuid) AS entity_uuid, description,
      BUID(record_uuid) AS record_uuid, trans_date, debit, credit, document, balance,
      (@cumsum := balance + @cumsum) AS cumsum
    FROM (
      SELECT p.trans_id, p.entity_uuid, p.description, p.record_uuid, p.trans_date,
        SUM(p.debit_equiv) AS debit, SUM(p.credit_equiv) AS credit, dm.text AS document,
        SUM(p.credit_equiv) - SUM(p.debit_equiv) AS balance, 0 AS posted
      FROM posting_journal AS p
        LEFT JOIN document_map AS dm ON dm.uuid = p.record_uuid
      WHERE p.entity_uuid = ? ${filterBydatePosting}
      GROUP BY p.record_uuid

      UNION ALL

      SELECT g.trans_id, g.entity_uuid, g.description, g.record_uuid, g.trans_date,
        SUM(g.debit_equiv) AS debit, SUM(g.credit_equiv) AS credit, dm.text AS document,
        SUM(g.credit_equiv) - SUM(g.debit_equiv) AS balance, 1 AS posted
      FROM general_ledger AS g
        LEFT JOIN document_map AS dm ON dm.uuid = g.record_uuid
      WHERE g.entity_uuid = ? ${filterBydateLegder}
      GROUP BY g.record_uuid
    )c, (SELECT @cumsum := 0)z
    ORDER BY trans_date ASC, trans_id;
  `;

  const tabSQL = [db.exec(sql, [uid, uid]), balance(creditorUuid)];
  if (dateFrom && dateTo) { tabSQL.push(openingBalanceCreditor(creditorUuid, dateFrom)); }

  return Promise.all(tabSQL)
    .then(([transactions, aggs, openingBalance]) => {
      if (!aggs.length) {
        aggs.push({ debit : 0, credit : 0, balance : 0 });
      }

      const [aggregates] = aggs;
      return { transactions, aggregates, openingBalance };
    });
}
