/**
 * Cash Controller
 *
 * This controller is responsible for processing cash payments for patients. The
 * payments can either be against an previous invoice (invoice payment) or a
 * future invoice (cautionary payment).
 *
 * In order to reduce the burden of accounting on the user, the user will first
 * select a cashbox which implicitly bundles in cash accounts for all supported
 * currencies.  The API accepts a cashbox ID during cash payment creation and
 * looks up the correct account based on the cashbox_id + currency.
 * @module finance/cash
 *
 * @requires lib/db
 * @requires lib/filters
 * @requires lib/barcode
 * @requires lib/errors/NotFound
 * @requires lib/errors/BadRequest
 * @requires config/identifiers
 * @requires cash.create
 */

const _ = require('lodash');

const db = require('../../lib/db');
const barcode = require('../../lib/barcode');
const FilterParser = require('../../lib/filter');
const { BadRequest, NotFound } = require('../../lib/errors');
const identifiers = require('../../config/identifiers');
const cashCreate = require('./cash.create');

// shared transaction methods
// TODO(@jniles) - find a better name
const shared = require('./shared');

exports.detail = detail;
exports.read = read;
exports.create = cashCreate;
exports.update = update;
exports.lookup = lookup;
exports.find = find;
exports.checkInvoicePayment = checkInvoicePayment;
exports.safelyDeleteCashPayment = safelyDeleteCashPayment;

const CASH_KEY = identifiers.CASH_PAYMENT.key;

// looks up a single cash record and associated cash_items
function lookup(uuid) {
  const bid = db.bid(uuid);

  let record;

  const cashRecordSql = `
    SELECT BUID(cash.uuid) as uuid, cash.project_id, dm.text AS reference,
      d.text as debtorName, em.text as debtorReference,
      cash.date, cash.created_at, BUID(cash.debtor_uuid) AS debtor_uuid, cash.currency_id, cash.amount,
      cash.description, cash.cashbox_id, cash.is_caution, cash.user_id, cash.edited, cash.posted
    FROM cash JOIN project ON cash.project_id = project.id
      JOIN document_map dm ON cash.uuid = dm.uuid
      JOIN debtor d ON d.uuid = cash.debtor_uuid
      JOIN entity_map em On d.uuid = em.uuid
    WHERE cash.uuid = ?;
  `;

  const cashItemsRecordSql = `
    SELECT BUID(ci.uuid) AS uuid, ci.amount, BUID(ci.invoice_uuid) AS invoice_uuid,
      s.name AS serviceName, dm.text AS reference
    FROM cash_item AS ci
      JOIN invoice AS i ON ci.invoice_uuid = i.uuid
      JOIN project AS p ON i.project_id = p.id
      JOIN document_map dm ON i.uuid = dm.uuid
      LEFT JOIN service AS s ON i.service_uuid = s.uuid
    WHERE ci.cash_uuid = ?
    ORDER BY i.date ASC;
  `;

  return db.exec(cashRecordSql, [bid])
    .then((rows) => {
      if (!rows.length) {
        throw new NotFound(`No cash record by uuid: ${uuid}`);
      }

      // store the record for return
      [record] = rows;

      return db.exec(cashItemsRecordSql, bid);
    })
    .then((rows) => {
      // bind the cash items to the "items" property and return
      record.items = rows;

      record.barcode = barcode.generate(CASH_KEY, record.uuid);
      return record;
    });
}

/**
 *
 * @method read
 *
 * @description
 * Lists the cash payments with optional filtering parameters.
 * search cash payment by some filters given
 *
 * GET /cash
 *
 * @returns {Array} payments - an array of { uuid, reference, date } JSONs
 */
function read(req, res, next) {
  find(req.query)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

}

/**
 * @method find
 *
 * @description
 * This method uses the FilterParser library to compose a query matching the
 * query parameters passed in via the options object.
 *
 * @param {Object} options - a series of key/value pairs to be used for
 *    filtering the cash table.
 */
function find(options) {
  // ensure expected options are parsed appropriately as binary
  db.convert(options, ['debtor_uuid', 'debtor_group_uuid', 'invoice_uuid', 'uuid']);
  const filters = new FilterParser(options, { tableAlias : 'cash' });

  const sql = `
    SELECT BUID(cash.uuid) as uuid, cash.project_id, dm.text as reference,
      cash.date, cash.created_at,  BUID(cash.debtor_uuid) AS debtor_uuid, cash.currency_id,
      cash.amount, cash.description, cash.cashbox_id, cash.is_caution, cash.user_id,
      cash.reversed, d.text AS debtor_name, cb.label AS cashbox_label, u.display_name,
      p.display_name AS patientName, em.text AS patientReference, cash.edited, cash.created_at
    FROM cash
      JOIN document_map dm ON dm.uuid = cash.uuid
      JOIN project ON cash.project_id = project.id
      JOIN debtor d ON d.uuid = cash.debtor_uuid
      JOIN patient p on p.debtor_uuid = d.uuid
      JOIN entity_map em ON em.uuid = p.uuid
      JOIN cash_box cb ON cb.id = cash.cashbox_id
      JOIN user u ON u.id = cash.user_id
  `;

  filters.equals('uuid');
  filters.dateFrom('custom_period_start', 'date');
  filters.dateTo('custom_period_end', 'date');
  filters.equals('cashbox_id');
  filters.equals('currency_id');
  filters.equals('debtor_group_uuid', 'group_uuid', 'd');
  filters.equals('debtor_uuid');
  filters.equals('edited');
  filters.equals('is_caution');
  filters.equals('project_id');
  filters.equals('reversed');
  filters.equals('user_id');
  filters.fullText('description');
  filters.period('period', 'date');

  filters.fullText('description');

  filters.equals('reference', 'text', 'dm');
  filters.equals('patientReference', 'text', 'em');

  // @TODO Support ordering query (reference support for limit)?
  filters.setOrder('ORDER BY cash.date DESC');

  filters.custom(
    'invoice_uuid',
    'cash.uuid IN (SELECT cash_item.cash_uuid FROM cash_item WHERE cash_item.invoice_uuid = ?)',
  );

  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  return db.exec(query, parameters);
}

/**
 * @method detail
 *
 * @description
 * Get the details of a particular cash payment.  Expects a uuid.
 * GET /cash/:uuid
 */
function detail(req, res, next) {
  lookup(req.params.uuid)
    .then(record => {
      res.status(200).json(record);
    })
    .catch(next);

}

/**
 * PUT /cash/:uuid
 * Updates the non-financial details associated with a cash payment.
 * NOTE - this will not update the cash_item.
 *
 * @todo - remove protected fields check -- the database should do this
 * automatically
 */
function update(req, res, next) {
  const sql = 'UPDATE cash SET ? WHERE uuid = ?;';

  // protected database fields that are unavailable for updates.
  const protect = [
    'is_caution', 'amount', 'user_id', 'cashbox_id',
    'currency_id', 'date', 'project_id', 'posted',
  ];

  // loop through update keys and ensure that we are only updating non-protected
  // fields
  const keys = Object.keys(req.body);
  const hasProtectedKey = keys.some(key => protect.indexOf(key) > -1);

  // if we have a protected key, emit an error
  if (hasProtectedKey) {
    throw new BadRequest('The update request attempted to change a protected field.', 'ERRORS.PROTECTED_FIELD');
  }

  // delete the uuid if it exists
  delete req.body.uuid;

  // properly parse date if it exists
  if (req.body.date) {
    _.extend(req.body, { date : new Date(req.body.date) });
  }

  // if checks pass, we are free to continue with our updates to the db
  lookup(req.params.uuid)

    // if we get here, we know we have a cash record by this UUID.
    // we can try to update it.
    .then(() => db.exec(sql, [req.body, db.bid(req.params.uuid)]))
    .then(() => lookup(req.params.uuid))
    .then((record) => {
      // all updates completed successfully, return full object to client
      res.status(200).json(record);
    })
    .catch(next);

}

const PREPAYMENT_LINK_TYPE_ID = 19;

/**
 * GET /cash/:checkin/:invoiceUuid
 * Check if the invoice is paid
 * TODO(@jniles) - this should use a more intelligent system to see if an
 * invoice is referenced ... probably by scanning the ledgers for any
 * referencing transactions.
 */
function checkInvoicePayment(req, res, next) {
  const bid = db.bid(req.params.invoiceUuid);

  const getInvoicePayment = `
    SELECT DISTINCT BUID(cash_item.cash_uuid) cash_uuid, BUID(cash_item.invoice_uuid) invoice_uuid, cash.reversed
    FROM cash JOIN cash_item ON cash.uuid = cash_item.cash_uuid
    WHERE cash_item.invoice_uuid = ? AND cash.reversed <> 1;
  `;

  const getPrepaymentLinkPayment = `
    SELECT DISTINCT BUID(vi.voucher_uuid) voucher_uuid, BUID(vi.document_uuid) document_uuid
    FROM voucher v JOIN voucher_item vi ON v.uuid = vi.voucher_uuid
    WHERE vi.document_uuid = ? AND v.reversed <> 1
      AND v.type_id = ${PREPAYMENT_LINK_TYPE_ID};
  `;

  Promise.all([
    db.exec(getInvoicePayment, [bid]),
    db.exec(getPrepaymentLinkPayment, [bid]),
  ])
    .then(([invoices, prepayments]) => {
      res.status(200).json([...invoices, ...prepayments]);
    })
    .catch(next);
}

/**
 * @function safelyDeleteCashPayment
 *
 * @description
 * This function deletes the cash payment from the system.  It assumes that
 * checks have already been made for referencing transactions.
 */
function safelyDeleteCashPayment(uuid) {
  const DELETE_TRANSACTION = `
    DELETE FROM posting_journal WHERE record_uuid = ?;
  `;

  const DELETE_CASH_PAYMENT = `
    DELETE FROM cash WHERE uuid = ?;
  `;

  const DELETE_DOCUMENT_MAP = `
    DELETE FROM document_map WHERE uuid = ?;
  `;

  return shared.isRemovableTransaction(uuid)
    .then(() => {
      const binaryUuid = db.bid(uuid);
      const transaction = db.transaction();

      transaction
        .addQuery(DELETE_TRANSACTION, binaryUuid)
        .addQuery(DELETE_CASH_PAYMENT, binaryUuid)
        .addQuery(DELETE_DOCUMENT_MAP, binaryUuid);

      return transaction.execute();
    });
}
