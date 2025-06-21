/**
 * @overview transactions.js
 *
 * @description
 * This module contains the DELETE route for transactions.
 *
 * @requires lib/db
 * @requires controllers/finance/shared
 * @requires controllers/finance/cash
 * @requires controllers/finance/vouchers
 * @requires controllers/finance/patientInvoice
 */

const debug = require('debug')('bhima:controller:transactions');
const shared = require('./shared');
const db = require('../../lib/db');
const Unauthorized = require('../../lib/errors/Unauthorized');
const {
  DELETE_CASH_PAYMENT,
  DELETE_INVOICE,
  DELETE_VOUCHER,
} = require('../../config/constants').actions;

const Cash = require('./cash');
const Invoices = require('./patientInvoice');
const Vouchers = require('./vouchers');

// this wraps up the safe deletion methods.
// TODO(@jniles) - move these to the `indentifiers` as suggested by @sfount
const safeDeletionMethods = {
  CP : Cash.safelyDeleteCashPayment,
  IV : Invoices.safelyDeleteInvoice,
  VO : Vouchers.safelyDeleteVoucher,
};

exports.deleteRoute = deleteRoute;
exports.deleteTransaction = deleteTransaction;
exports.commentTransactions = commentTransactions;

// expects a buffer and makes it into a nicely formatted UUID
function formatUuid(uuid) {
  const str = uuid.toString('hex');
  return `${str.slice(0, 8)}-${str.slice(8, 12)}-${str.slice(12, 16)}-${str.slice(16, 20)}-${str.slice(20)}`;
}

/**
 * @function parseDocumentMapString
 *
 * @description
 * This function parses the document map identifier and returns the safe
 * deletion method associated with this document.
 *
 * @param {String} text - the text of the document map
 *
 * @returns {Function} the safe deletion method associated with the module
 */
function parseDocumentMapString(text) {
  const key = text.split('.').shift();
  return safeDeletionMethods[key];
}

/**
 * @functio isUserAuthorized
 *
 * @description
 * This function checks if the user is authorized to delete the record from their "actions"
 * set by their user role.
 *
 * @returns {Boolean} true if the user is authorized, false if not.
 */
function isUserAuthorized(text, actions) {
  const key = text.split('.').shift();
  const authMap = {
    CP : DELETE_CASH_PAYMENT,
    IV : DELETE_INVOICE,
    VO : DELETE_VOUCHER,
  };

  return actions.includes(authMap[key]);
}

/**
 * @function deleteRoute
 *
 * @description
 * This function is the HTTP handler for the delete transactions route.
 *
 * DELETE /transactions/:uuid
 */
function deleteRoute(req, res, next) {
  const { uuid } = req.params;

  debug(`#delete() attempting to remove transaction ${uuid}.`);

  deleteTransaction(uuid, req.session.actions, req.session.user.id)
    .then(() => {
      debug(`#delete() successfully removed transaction ${uuid}.`);
      res.sendStatus(201);
    })
    .catch(next);
}

function formatTransactionRecord(txnRecord) {
  return txnRecord.map(row => {
    const parsed = { ...row };
    parsed.uuid = formatUuid(row.uuid);
    parsed.record_uuid = formatUuid(row.record_uuid);

    if (row.reference_uuid && row.reference_uuid !== null) {
      parsed.reference_uuid = formatUuid(row.reference_uuid);
    }

    if (row.entity_uuid && row.entity_uuid !== null) {
      parsed.entity_uuid = formatUuid(row.entity_uuid);
    }
    return parsed;
  });
}

async function deleteTransaction(uuid, actions, userId) {
  const documentMap = await shared.getRecordTextByUuid(uuid);

  debug(`#delete() resolved transaction ${uuid} to ${documentMap.text}.`);

  // route to do the correct safe deletion method.
  const safeDeleteFn = parseDocumentMapString(documentMap.text);

  if (!isUserAuthorized(documentMap.text, actions)) {
    debug(`#delete() user is not autorized to remove ${documentMap.text}!`);
    throw new Unauthorized(`User is not authorized to remove ${documentMap.text}.`);
  }

  const transactionRecord = await db.exec(`
    SELECT pj.*, dm.text as hrRecord
    FROM posting_journal pj
    JOIN document_map dm ON dm.uuid = pj.record_uuid
    WHERE pj.record_uuid = ?
  `, [db.bid(uuid)]);

  const INSERT_TRANSACTION_HISTORY = 'INSERT INTO transaction_history SET ?;';

  // properly parsethe transaction record before storing it

  const transactionHistory = {
    uuid : db.uuid(),
    record_uuid : db.bid(uuid),
    user_id : userId,
    action : 'deleted',
    value : JSON.stringify(formatTransactionRecord(transactionRecord)),
  };

  await db.exec(INSERT_TRANSACTION_HISTORY, transactionHistory);

  // run the safe deletion method
  return safeDeleteFn(uuid);
}

/**
 * PUT /transactions/comments
 *
 * @function commentTransactions
 *
 * @description
 * This function will put a comment on rows in both the posting journal and
 * general ledger.  To remove the comment, you should just send an empty
 * comment.
 *
 * @param {object} params - { uuids: [...], comment: '' }
 */
function commentTransactions(req, res, next) {
  const { uuids, comment } = req.body.params;
  const uids = uuids.map(db.bid);

  const journalUpdate = 'UPDATE posting_journal SET comment = ? WHERE uuid IN ?';
  const ledgerUpdate = 'UPDATE general_ledger SET comment = ? WHERE uuid IN ?';

  Promise.all([
    db.exec(journalUpdate, [comment, [uids]]),
    db.exec(ledgerUpdate, [comment, [uids]]),
  ])
    .then(() => {
      res.sendStatus(200);
    })
    .catch(next);
}
