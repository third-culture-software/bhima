/**
 * @overview shared.js
 *
 * @description
 * This module contains helper functions for operating on transactions.  These
 * helper functions do things like like
 *
 * @requires lib/db
 * @requires lib/errors/BadRequest
 */

const db = require('../../lib/db');
const FilterParser = require('../../lib/filter');
const BadRequest = require('../../lib/errors/BadRequest');

exports.getTransactionReferences = getTransactionReferences;
exports.getTransactionRecords = getTransactionRecords;
exports.isRemovableTransaction = isRemovableTransaction;

exports.getRecordTextByUuid = getRecordTextByUuid;
exports.getEntityTextByUuid = getEntityTextByUuid;

exports.getRecordUuidByText = getRecordUuidByText;
exports.getRecordUuidByTextBulk = getRecordUuidByTextBulk;

exports.getEntityUuidByText = getEntityUuidByText;
exports.getEntityUuidByTextBulk = getEntityUuidByTextBulk;

exports.lookupFinancialEntityByUuid = async (req, res) => {
  const uuid = db.bid(req.params.uuid);

  const debtorSQL = `
    SELECT em.uuid, em.text, d.text as hrLabel FROM entity_map em JOIN debtor d ON em.uuid = d.uuid
    WHERE em.uuid = ?
  `;

  const creditorSQL = `
    SELECT em.uuid, em.text, c.text as hrLabel FROM entity_map em JOIN creditor c ON em.uuid = c.uuid
    WHERE em.uuid = ?
  `;

  const combinedSQL = `
    SELECT BUID(uuid) as uuid, text, hrLabel FROM (
      ${debtorSQL} UNION ${creditorSQL}
    )z ORDER BY text LIMIT 1;
  `;

  const record = await db.one(combinedSQL, [uuid, uuid]);
  res.status(200).json(record);
};

exports.lookupFinancialRecordByUuid = async (req, res) => {
  const uuid = db.bid(req.params.uuid);

  const vouchers = getQueryForTable('voucher', { uuid });
  const invoices = getQueryForTable('invoice', { uuid });
  const cash = getQueryForTable('cash', { uuid });

  const records = await Promise.all([
    db.exec(vouchers.query, vouchers.parameters),
    db.exec(invoices.query, invoices.parameters),
    db.exec(cash.query, cash.parameters),
  ]);
  const [record] = records.reduce((a, b) => a.concat(b), []);
  res.status(200).json(record);

};

/**
 * @function lookupFinancialEntity
 *
 * @description
 * An HTTP interface to lookup financial entities (debtors/creditors) in the database.
 */
exports.lookupFinancialEntity = async (req, res) => {
  const options = req.query;
  db.convert(options, ['uuid']);

  // default limit is 100
  const limit = options?.limit ?? 100;
  delete options.limit;

  const filters = new FilterParser(options);

  const debtorSQL = `
    SELECT em.uuid, em.text, d.text as hrLabel FROM entity_map em JOIN debtor d ON em.uuid = d.uuid
  `;

  const creditorSQL = `
    SELECT em.uuid, em.text, c.text as hrLabel FROM entity_map em JOIN creditor c ON em.uuid = c.uuid
  `;

  filters.equals('uuid', 'uuid', 'em');
  filters.fullText('text', 'text', 'em');

  const debtorQuery = filters.applyQuery(debtorSQL);
  const creditorQuery = filters.applyQuery(creditorSQL);
  const parameters = filters.parameters();

  const query = `
    SELECT BUID(uuid) as uuid, text, hrLabel FROM (
      ${debtorQuery} UNION ${creditorQuery}
    )z ORDER BY text LIMIT ${limit};
  `;

  const rows = await db.exec(query, [...parameters, ...parameters]);
  res.status(200).json(rows);
};

function getQueryForTable(table, options) {
  const filters = new FilterParser(options);
  db.convert(options, ['uuid']);

  const sql = `
    SELECT BUID(dm.uuid) AS uuid, dm.text, t.description, t.date
    FROM document_map dm JOIN ${table} t ON dm.uuid = t.uuid
  `;

  filters.equals('uuid', 'uuid', 't');
  filters.fullText('text');
  filters.setOrder('ORDER BY t.date DESC');

  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  return { query, parameters };
}

/**
 * @function lookupFinancialRecord
 *
 * @description
 * An HTTP interface to lookup financial records (cash/voucher/invoices) in the database.
 */
exports.lookupFinancialRecord = async (req, res) => {
  const options = structuredClone(req.query);

  const vouchers = getQueryForTable('voucher', options);
  const invoices = getQueryForTable('invoice', options);
  const cash = getQueryForTable('cash', options);

  const records = await Promise.all([
    db.exec(vouchers.query, vouchers.parameters),
    db.exec(invoices.query, invoices.parameters),
    db.exec(cash.query, cash.parameters),
  ]);

  const r = records.reduce((a, b) => a.concat(b), []);
  res.status(200).json(r);
};

/**
 * @function getRecordUuidByText
 *
 * @description
 * This function gets a record uuid by its human readable text.  It is useful for creating vouchers
 * or editing records in the journal.
 */
function getRecordUuidByText(hrRecord) {
  const sql = `
    SELECT uuid FROM document_map WHERE text = ?;
  `;

  return db.one(sql, hrRecord);
}

/**
 * @function getRecordUuidByTextBulk
 *
 * @description
 * This function returns the record uuids associated with an array of human readble document identifiers.
 */
function getRecordUuidByTextBulk(hrRecords) {
  const sql = `
    SELECT uuid, text FROM document_map WHERE text IN (?);
  `;

  return db.exec(sql, [hrRecords]);
}

/**
 * @function getEntityUuidByText
 *
 * @description
 * This function gets an entity uuid by its human readable text.  It is useful for creating vouchers
 * or editing records in the journal where entities are specified by their text by users and later
 * linked up by their uuids in the database.
 */
function getEntityUuidByText(hrEntity) {
  const sql = `
    SELECT em.uuid FROM entity_map em JOIN debtor ON em.uuid = debtor.uuid WHERE em.text = ?
    UNION
    SELECT em.uuid FROM entity_map em JOIN creditor ON em.uuid = creditor.uuid WHERE em.text = ?;
  `;

  return db.one(sql, [hrEntity, hrEntity]);
}

/**
 * @function getEntityUuidByTextBulk
 *
 * @description
 * This function gets multiple entity uuids by their human readable text.  It is useful for creating vouchers
 * or editing records in the journal where entities are specified by their text by users and later
 * linked up by their uuids in the database.
 */
function getEntityUuidByTextBulk(hrEntities) {
  const sql = `
    SELECT em.uuid FROM entity_map em JOIN debtor ON em.uuid = debtor.uuid WHERE em.text IN (?)
    UNION
    SELECT em.uuid FROM entity_map em JOIN creditor ON em.uuid = creditor.uuid WHERE em.text IN (?);
  `;

  return db.exec(sql, [hrEntities, hrEntities]);
}

/**
 * @function getRecordTextByUuid
 *
 * @description
 * This function returns a record's human readable text string by its uuid.
 */
function getRecordTextByUuid(uuid) {
  const sql = `
    SELECT text FROM document_map WHERE uuid = ?;
  `;

  return db.one(sql, db.bid(uuid));
}

/**
 * @function getEntityTextByUuid
 *
 * @description
 * This function returns an entity's human readable text from the entity_map
 * table.
 */
function getEntityTextByUuid(uuid) {
  const sql = `
    SELECT text FROM entity_map WHERE uuid = ?;
  `;

  return db.one(sql, db.bid(uuid));
}

/**
 * @function getTransactionReferences
 *
 * @description
 * This function will find the uuids of any transactions that reference the
 * provided transaction's uuid.
 *
 * @param {String} transactionUuid - the record_uuid of the transaction
 */
function getTransactionReferences(transactionUuid) {
  const sql = `
    SELECT DISTINCT uuid, text FROM (
      SELECT dm.uuid, dm.text
      FROM posting_journal AS j JOIN document_map AS dm ON
        j.reference_uuid = dm.uuid
      WHERE j.reference_uuid = ?

      UNION ALL

      SELECT dm.uuid, dm.text
      FROM general_ledger AS g JOIN document_map AS dm ON
        g.reference_uuid = dm.uuid
      WHERE g.reference_uuid = ?
    )c;
  `;

  const buid = db.bid(transactionUuid);

  return db.exec(sql, [buid, buid]);
}

/**
 * @function getTransactionRecords
 *
 * @description
 * Returns the transaction from the posting journal and general_ledger.
 */
function getTransactionRecords(uuid) {
  const sql = `
      SELECT BUID(j.uuid) AS uuid, trans_id, BUID(record_uuid) AS record_uuid,
        trans_date, debit_equiv, credit_equiv, currency_id,
        BUID(reference_uuid) AS reference_uuid,
        BUID(entity_uuid) AS entity_uuid, 0 AS posted,
        document_map.text AS identifier
      FROM posting_journal AS j JOIN document_map ON
        j.record_uuid = document_map.uuid
      WHERE record_uuid = ?

      UNION ALL

      SELECT BUID(j.uuid) AS uuid, trans_id, BUID(record_uuid) AS record_uuid,
        trans_date, debit_equiv, credit_equiv, currency_id,
        BUID(reference_uuid) AS reference_uuid,
        BUID(entity_uuid) AS entity_uuid, 1 AS posted,
        document_map.text AS identifier
      FROM general_ledger AS j JOIN document_map ON
        j.record_uuid = document_map.uuid
      WHERE record_uuid = ?
  `;

  return db.exec(sql, [db.bid(uuid), db.bid(uuid)]);
}

/**
 * @function isRemovableTransaction
 *
 * @description
 * Checks to see if the transaction meets the criteria for removing. A transaction cannot
 * be removed if it is:
 *  1. Posted to the General Ledger
 *  2. Referenced by another transaction.
 */
async function isRemovableTransaction(uuid) {
  // get all the rows of the transaction
  const [row] = await getTransactionRecords(uuid);
  const isPosted = row.posted;

  if (isPosted) {
    throw new BadRequest(
      `Transaction ${row.trans_id} (${row.identifier}) is already posted.`,
      'TRANSACTIONS.ERRORS.TRANSACTION_POSTED',
    );
  }

  const references = await getTransactionReferences(uuid);
  const isReferenced = references.length > 0;
  if (isReferenced) {
    throw new BadRequest('This transaction is referenced.', 'TRANSACTIONS.ERRORS.TRANSACTION_REFERENCED');
  }
}
