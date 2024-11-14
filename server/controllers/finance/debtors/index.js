/**
* Debtors Controller
*
* This module is responsible for handling crud operations on the debtor
* table.  Currently, this is limited to update (debtors are created in
* association with other entities, such as patients).
*
* There are also some specialized queries such as looking up imbalanced
* invoices, and looking up the balance on a debtor's account.
*
* @module controllers/finance/debtors
*
* @requires lodash
* @requires lib/db
* @requires lib/errors/NotFound
*/

const _ = require('lodash');
const db = require('../../../lib/db');
const NotFound = require('../../../lib/errors/NotFound');
const FilterParser = require('../../../lib/filter');

const CAUTION_LINK_TYPE_ID = 19;

exports.list = list;
exports.detail = detail;
exports.update = update;
exports.invoices = invoices;
exports.invoiceBalances = invoiceBalances;
exports.getDebtorInvoices = getDebtorInvoices;
exports.balance = balance;
exports.getFinancialActivity = getFinancialActivity;

/**
 * List of debtors
 */
function list(req, res, next) {
  const options = req.query;

  db.convert(options, ['uuid', 'group_uuid']);
  const filters = new FilterParser(options, { tableAlias : 'd' });

  const sql = `
    SELECT BUID(d.uuid) AS uuid, BUID(d.group_uuid) AS group_uuid,
      d.text, em.text as hrEntity
    FROM debtor d JOIN entity_map em ON em.uuid = d.uuid
  `;

  filters.equals('uuid');
  filters.equals('group_uuid');
  filters.custom('hrEntity', 'em.text = ?');

  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  db.exec(query, parameters)
    .then(rows => { res.status(200).json(rows); })
    .catch(next);
}

/*
 * Detail of debtors
 */
function detail(req, res, next) {
  lookupDebtor(req.params.uuid)
    .then((debtor) => {
      res.status(200).json(debtor);
    })
    .catch(next);
}

/**
 * Updates a debtor's details (particularly group_uuid)
 */
async function update(req, res, next) {
  const sql = `UPDATE debtor SET ? WHERE uuid = ?`;
  const previousGroupSql = 'SELECT BUID(group_uuid) as group_uuid  FROM debtor WHERE uuid=?';
  const historicSQL = `INSERT INTO debtor_group_history SET ?`;
  const { user } = req.session;
  const data = _.clone(req.body);

  // delete the uuid if it exists
  delete data.uuid;

  // cache the incoming uuid for fast lookups
  const uid = db.bid(req.params.uuid);

  try {
    // let get some informations for historic
    const previousGroup = await db.one(previousGroupSql, uid);
    // escape the group_uuid if it exists
    if (req.body.group_uuid) {
      data.group_uuid = db.bid(req.body.group_uuid);
    }
    const transaction = db.transaction();
    transaction.addQuery(sql, [data, uid]);

    // check if we should update the historic table
    transaction.addQuery(historicSQL, {
      uuid : db.uuid(),
      user_id : user.id,
      debtor_uuid : uid,
      previous_debtor_group : db.bid(previousGroup.group_uuid),
      next_debtor_group : data.group_uuid,
    });

    await transaction.execute();
    const debtor = await lookupDebtor(req.params.uuid);
    res.status(200).json(debtor);

  } catch (error) {
    next(error);
  }

}

/**
 * Find a debtor by their uuid.
 *
 * @param {String} uid - the uuid of the debtor
 * @returns {Promise} promise resolving to the debtor object
 */
function lookupDebtor(uid) {
  const sql = `
    SELECT BUID(uuid) AS uuid, BUID(group_uuid) AS group_uuid, text
    FROM debtor
    WHERE uuid = ?;
  `;

  return db.exec(sql, [db.bid(uid)])
    .then((rows) => {
      if (!rows.length) {
        throw new NotFound(`Could not find a debtor with uuid ${uid}`);
      }
      return rows[0];
    });
}

/**
 * This function returns all invoices billed to a particular debtor.
 *
 * The algorithm works like this:
 *  1) Look up all invoices billed to that debtor
 *  2) Look up those invoices in the combined ledger, as well as payments
 *    against them.  These are summed into debits and credits.
 *
 * The database will optionally filter invoices based on whether they are
 * balanced (paid off) or not.
 *
 * NOTE - this function is not suitable for reporting, and should only be used
 * by modules that need up-to-the minute debtor status.  There is no control
 * over the dataset queried only the debtor
 *
 * @method invoices
 */
function invoices(req, res, next) {
  const options = req.query;

  getDebtorInvoices(req.params.uuid)
    .then(uuids => invoiceBalances(req.params.uuid, uuids, options))
    .then(debtorInvoices => {
      res.status(200).json(debtorInvoices);
    })
    .catch(next);

}

/**
 * This function sends back a list of invoices uuids
 * which belong to a particular debtor
 */
function getDebtorInvoices(debtorUuid) {
  const debtorUid = db.bid(debtorUuid);
  const reversalVoucherType = 10;

  // get the debtor invoice uuids from the invoice table
  const sql = `
    SELECT BUID(invoice.uuid) as uuid
    FROM invoice
    WHERE debtor_uuid = ? AND invoice.reversed = 0
    ORDER BY invoice.date ASC, invoice.reference;
  `;

  return db.exec(sql, [debtorUid, reversalVoucherType])
    .then(uuids => {
      // if nothing found, return an empty array
      if (!uuids.length) { return []; }
      return uuids.map(item => item.uuid);
    });
}

function invoiceBalances(debtorUuid, uuids, options = {}) {
  const debtorUid = db.bid(debtorUuid);

  let balanced = '';
  let orderBy = '';

  if (options.balanced === '1') {
    balanced = 'HAVING balance = 0';
  } else if (options.balanced === '0') {
    balanced = 'HAVING balance <> 0';
  }

  if (options.descLimit5 === '1') {
    orderBy = 'ORDER BY invoice.date DESC, invoice.reference LIMIT 5';
  } else {
    orderBy = 'ORDER BY invoice.date ASC, invoice.reference';
  }

  const invs = uuids.map(uid => db.bid(uid));

  if (uuids.length === 0) { return []; }

  // select all invoice and payments against invoices from the combined ledger
  // @TODO this query is used in many places and is crucial for finding balances
  //       it currently uses 5 sub queries - this should be improved
  const sql = `
    SELECT BUID(i.uuid) AS uuid, dm.text AS reference, credit, debit, balance,
      BUID(entity_uuid) AS entity_uuid, invoice.date, invoice.description
    FROM (
      SELECT uuid, SUM(debit) AS debit, SUM(credit) AS credit, SUM(debit-credit) AS balance, entity_uuid
      FROM (
        SELECT record_uuid AS uuid, debit_equiv as debit, credit_equiv as credit, entity_uuid
        FROM posting_journal
        WHERE posting_journal.record_uuid IN (?) AND entity_uuid = ?

        UNION ALL

        SELECT record_uuid AS uuid, debit_equiv as debit, credit_equiv as credit, entity_uuid
         FROM  general_ledger
         WHERE general_ledger.record_uuid IN (?) AND entity_uuid = ?

         UNION ALL

        SELECT reference_uuid AS uuid, debit_equiv as debit, credit_equiv as credit, entity_uuid
        FROM posting_journal
        WHERE posting_journal.reference_uuid IN (?) AND entity_uuid = ?

        UNION ALL

        SELECT reference_uuid AS uuid, debit_equiv as debit, credit_equiv as credit, entity_uuid
        FROM general_ledger
        WHERE general_ledger.reference_uuid IN (?) AND entity_uuid = ?

      ) AS ledger
      GROUP BY ledger.uuid ${balanced}
    ) AS i
      JOIN invoice ON i.uuid = invoice.uuid
      JOIN project ON invoice.project_id = project.id
      LEFT JOIN document_map dm ON i.uuid = dm.uuid
    ${orderBy};
  `;

  return db.exec(sql, [invs, debtorUid, invs, debtorUid, invs, debtorUid, invs, debtorUid]);
}

/**
 * This function returns the balance of a debtors account with the hospital.
 *
 * The algorithm works like this:
 *  1) Look up all transaction lines associated with that debtor and sum the
 *  debits and credits.
 *
 * NOTE - this function is not suitable for reporting, and should only be used
 * by modules that need up-to-the minute debtor status.  There is no control
 * over the dataset queried only the debtor
 *
 * @method balance
 */
function balance(debtorUuid, excludeCautionLinks = false) {
  const debtorUid = db.bid(debtorUuid);

  const excludeCautionLinkStatement = `AND transaction_type_id <> ${CAUTION_LINK_TYPE_ID}`;

  /**
   * resolution of the problem when calling the Debtors.balance function with
   * rounding to two ranks after the decimal point of the total credit and
   * debit values
   *
   */
  const sql = `
    SELECT IFNULL(SUM(ledger.debit_equiv), 0) AS debit, IFNULL(SUM(ledger.credit_equiv), 0) AS credit,
    IFNULL(SUM(ledger.debit_equiv - ledger.credit_equiv), 0) AS balance, MIN(trans_date) AS since,
    MAX(trans_date) AS until
    FROM (
      SELECT debit_equiv, credit_equiv, entity_uuid, trans_date FROM posting_journal
        WHERE entity_uuid = ? ${excludeCautionLinks ? excludeCautionLinkStatement : ''}
      UNION ALL
      SELECT debit_equiv, credit_equiv, entity_uuid, trans_date FROM general_ledger
        WHERE entity_uuid = ? ${excludeCautionLinks ? excludeCautionLinkStatement : ''}
    ) AS ledger
    GROUP BY ledger.entity_uuid;
  `;

  return db.exec(sql, [debtorUid, debtorUid]);
}

/**
 * @function getFinancialActivity
 *
 * @description
 * returns all transactions and balances associated with the debtor (or creditor).
 */
async function getFinancialActivity(debtorUuid, excludeCautionLinks = false) {
  const uid = db.bid(debtorUuid);

  const excludeCautionLinkStatement = `AND transaction_type_id <> ${CAUTION_LINK_TYPE_ID}`;

  const sql = `
    SELECT trans_id, BUID(entity_uuid) AS entity_uuid, description,
      BUID(record_uuid) AS record_uuid, trans_date, debit, credit, document, balance, created_at,
      (@cumsum := balance + @cumsum) AS cumsum
    FROM (
      SELECT p.trans_id, p.entity_uuid, p.description, p.record_uuid, p.trans_date,
        SUM(p.debit_equiv) AS debit, SUM(p.credit_equiv) AS credit, dm.text AS document,
        SUM(p.debit_equiv) - SUM(p.credit_equiv) AS balance, 0 AS posted, created_at
      FROM (
        SELECT trans_id, entity_uuid, description, record_uuid, trans_date,
          p.debit_equiv, p.credit_equiv, created_at
        FROM posting_journal AS p
        WHERE entity_uuid = ? ${excludeCautionLinks ? excludeCautionLinkStatement : ''}
        ORDER BY CHAR_LENGTH(description) DESC
      ) AS p
        LEFT JOIN document_map AS dm ON dm.uuid = p.record_uuid
      GROUP BY p.record_uuid

      UNION ALL

      SELECT g.trans_id, g.entity_uuid, g.description, g.record_uuid, g.trans_date,
        SUM(g.debit_equiv) AS debit, SUM(g.credit_equiv) AS credit, dm.text AS document,
        SUM(g.debit_equiv) - SUM(g.credit_equiv) AS balance, 0 AS posted, created_at
      FROM (
        SELECT trans_id, entity_uuid, description, record_uuid, trans_date,
          g.debit_equiv, g.credit_equiv, created_at
        FROM general_ledger AS g
        WHERE entity_uuid = ? ${excludeCautionLinks ? excludeCautionLinkStatement : ''}
        ORDER BY CHAR_LENGTH(description) DESC
      ) AS g
        LEFT JOIN document_map AS dm ON dm.uuid = g.record_uuid
      GROUP BY g.record_uuid
    )c, (SELECT @cumsum := 0)z
    ORDER BY trans_date ASC, trans_id ASC;
  `;

  const [transactions, aggs] = await Promise.all([
    db.exec(sql, [uid, uid]),
    balance(debtorUuid, excludeCautionLinks),
  ]);

  if (!aggs.length) {
    aggs.push({ debit : 0, credit : 0, balance : 0 });
  }

  const [aggregates] = aggs;
  return { transactions, aggregates };
}
